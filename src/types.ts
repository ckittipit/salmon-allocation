export type OrderType = 'EMERGENCY' | 'OVER_DUE' | 'DAILY'

export type Order = {
	order: string
	subOrder: string
	itemId: string
	warehouseId: string
	supplierId: string
	request: number
	type: OrderType
	createDate: string
	customerId: string
	remark?: string
}

export type PriceRow = {
	itemId: string
	supplierId: string
	price: number
	priceTier: OrderType
	percentage: number
}

export type Stock = {
	warehouseId: string
	supplierId: string
	itemId: string
	quantity: number
}

export type CustomerCredit = {
	customerId: string
	creditLimit: number
}

export type Allocation = {
	subOrder: string
	order: string
	customerId: string
	itemId: string
	warehouseId: string
	supplierId: string
	allocatedQty: number
	unitPrice: number
	amount: number
	reason: string
}
