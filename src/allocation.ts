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
	//factor, scaled เอาไว้เลื่อนทศนิยมไปเป็นจำนวนเต็มก่อน
	const factor = 10 ** decimals
	const scaled = value * factor
	//ปัดเป็นจำนวนเต็ม
	const floor = Math.floor(scaled)
	//diff = เศษระหว่างที่ปัดค่าลง
	const diff = scaled - floor

	//code banker's round ถ้า เศษ >.5ให้ปรับขึ้น <.5 ปรับลง
	if (diff > 0.5) return (floor + 1) / factor
	if (diff < 0.5) return floor / factor

	//banker's round's rule
	return floor % 2 === 0 ? floor / factor : (floor + 1) / factor
}

function getPrice(order: Order, supplierId: string, prices: PriceRow[]) {
	const exact = prices.find(
		(p) =>
			p.itemId === order.itemId &&
			p.supplierId === supplierId &&
			p.priceTier === order.type,
	)

	//ถ้าเจอราคาที่ตรง order type
	if (exact) return bankersRound(exact.price * exact.percentage)
	//ถ้าไม่เจอราคา
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
	//clone stocks ก่อนทำงาน เพื่อไม่ให้กระทบข้อมูลจริง
	const remainingStocks = stocks.map((stock) => ({ ...stock }))
	const remainingCredits = new Map(
		credits.map((customer) => [customer.customerId, customer.creditLimit]),
	)

	//sort ด้วย priority, FIFO
	const sortedOrders = [...orders].sort((a, b) => {
		const priorityDiff = priority[a.type] - priority[b.type]

		//ถ้า priority ไม่เท่ากัน return rn.
		if (priorityDiff !== 0) return priorityDiff

		//priority ไม่เท่ากันให้ดู First In First Out
		return (
			new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
		)
	})

	const allocations: Allocation[] = []

	for (const order of sortedOrders) {
		let remainingRequest = order.request
		//find stock which is match with order
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
			//ได้orderครบแล้วให้ reasom = fully : parti
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

export function validateManualAllocation(params: {
	requestedQty: number
	stockLeft: number
	creditLeft: number
	unitPrice: number
}) {
	const { requestedQty, stockLeft, creditLeft, unitPrice } = params

	if (requestedQty <= 0)
		return {
			ok: false,
			message: 'Allocated quantity must be more than 0',
		}

	if (requestedQty > stockLeft)
		return {
			ok: false,
			message: 'Allocated quantity remaining more than stock',
		}

	const amount = bankersRound(requestedQty * unitPrice)

	if (amount > creditLeft)
		return {
			ok: false,
			message: 'Allocated amount more than customer credit',
		}

	return { ok: true, message: 'Manual allocation is valid' }
}
