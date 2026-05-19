import type {
	Allocation,
	CustomerCredit,
	Order,
	PriceRow,
	Stock,
} from './types'

const priority = {
	EMERGENCY: 1,
	OVER_DUE: 2,
	DAILY: 3,
}

export function bankersRound(value: number, decimals = 2) {
	const factor = 10 ** decimals
	const scaled = value * factor
	const floor = Math.floor(scaled)
	const diff = scaled - floor

	if (diff > 0.5) return (floor + 1) / factor
	if (diff < 0.5) return floor / factor

	return floor % 2 === 0 ? floor / factor : (floor + 1) / factor
}

function getPrice(order: Order, supplierId: string, prices: PriceRow[]) {
	const exact = prices.find(
		(p) =>
			p.itemId === order.itemId &&
			p.supplierId === supplierId &&
			p.priceTier === order.type,
	)

	if (exact) return bankersRound(exact.price * exact.percentage)

	const fallback = prices.find(
		(p) => p.itemId === order.itemId && p.supplierId === supplierId,
	)

	if (!fallback) return 0

	return bankersRound(fallback.price * fallback.percentage)
}

export function autoAllocate(
	orders: Order[],
	stocks: Stock[],
	prices: PriceRow[],
	credits: CustomerCredit[],
) {
	const remainingStocks = stocks.map((stock) => ({ ...stock }))
	const remainingCredits = new Map(
		credits.map((customer) => [customer.customerId, customer.creditLimit]),
	)

	const sortedOrders = [...orders].sort((a, b) => {
		const priorityDiff = priority[a.type] - priority[b.type]

		if (priorityDiff !== 0) return priorityDiff

		return (
			new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
		)
	})

	const allocations: Allocation[] = []

	for (const order of sortedOrders) {
		let remainingRequest = order.request
		const candidateStocks = remainingStocks
			.filter((stock) => {
				const matchItem = stock.itemId === order.itemId
				const matchWarehouse =
					order.warehouseId === 'WH-000' ||
					stock.warehouseId === order.warehouseId
				const matchSupplier =
					order.supplierId === 'SP-000' ||
					stock.supplierId === order.supplierId

				return (
					matchItem &&
					matchWarehouse &&
					matchSupplier &&
					stock.quantity > 0
				)
			})
			.sort((a, b) => b.quantity - a.quantity)

		for (const stock of candidateStocks) {
			if (remainingRequest <= 0) break

			const unitPrice = getPrice(order, stock.supplierId, prices)

			if (unitPrice <= 0) {
				allocations.push({
					subOrder: order.subOrder,
					order: order.order,
					customerId: order.customerId,
					itemId: order.itemId,
					warehouseId: stock.warehouseId,
					supplierId: stock.supplierId,
					allocatedQty: 0,
					unitPrice: 0,
					amount: 0,
					reason: 'No frice found',
				})
				continue
			}

			const creditLeft = Number(
				remainingCredits.get(order.customerId) ?? 0,
			)
			const maxQtyByCredit =
				Math.floor((creditLeft / unitPrice) * 100) / 100
			const allocatedQty = bankersRound(
				Math.min(remainingRequest, stock.quantity, maxQtyByCredit),
			)

			if (allocatedQty <= 0) {
				allocations.push({
					subOrder: order.subOrder,
					order: order.order,
					customerId: order.customerId,
					itemId: order.itemId,
					warehouseId: stock.warehouseId,
					supplierId: stock.supplierId,
					allocatedQty: 0,
					unitPrice,
					amount: 0,
					reason: 'Insufficient customer creit',
				})
				break
			}

			const amount = bankersRound(allocatedQty * unitPrice)

			stock.quantity = bankersRound(stock.quantity - allocatedQty)
			remainingCredits.set(
				order.customerId,
				bankersRound(creditLeft - amount),
			)
			remainingRequest = bankersRound(remainingRequest - allocatedQty)

			allocations.push({
				subOrder: order.subOrder,
				order: order.order,
				customerId: order.customerId,
				itemId: order.itemId,
				warehouseId: stock.warehouseId,
				supplierId: stock.supplierId,
				allocatedQty,
				unitPrice,
				amount,
				reason:
					remainingRequest === 0
						? 'Fully Allocated'
						: 'Partially Allocated',
			})
		}

		if (candidateStocks.length === 0) {
			allocations.push({
				subOrder: order.subOrder,
				order: order.order,
				customerId: order.customerId,
				itemId: order.itemId,
				warehouseId: order.warehouseId,
				supplierId: order.supplierId,
				allocatedQty: 0,
				unitPrice: 0,
				amount: 0,
				reason: 'No stock available',
			})
		}
	}

	return { allocations, remainingStocks, remainingCredits }
}
