import type { CustomerCredit, Order, PriceRow, Stock } from './types'

export const orders: Order[] = [
	{
		order: 'ORDER-0001',
		subOrder: 'ORDER-0001-001',
		itemId: 'Item-1',
		warehouseId: 'WH-001',
		supplierId: 'SP-001',
		request: 11,
		type: 'DAILY',
		createDate: '2025-01-01',
		customerId: 'CT-0001',
	},
	{
		order: 'ORDER-0001',
		subOrder: 'ORDER-0001-002',
		itemId: 'Item-2',
		warehouseId: 'WH-002',
		supplierId: 'SP-000',
		request: 20,
		type: 'DAILY',
		createDate: '2025-01-01',
		customerId: 'CT-0001',
	},
	{
		order: 'ORDER-0002',
		subOrder: 'ORDER-0002-001',
		itemId: 'Item-1',
		warehouseId: 'WH-001',
		supplierId: 'SP-002',
		request: 300,
		type: 'EMERGENCY',
		createDate: '2025-03-01',
		customerId: 'CT-0002',
		remark: 'Special for VIP',
	},
	{
		order: 'ORDER-0002',
		subOrder: 'ORDER-0002-002',
		itemId: 'Item-2',
		warehouseId: 'WH-000',
		supplierId: 'SP-000',
		request: 100,
		type: 'EMERGENCY',
		createDate: '2025-03-01',
		customerId: 'CT-0002',
		remark: 'Special for VIP',
	},
]

export const prices: PriceRow[] = [
	{
		itemId: 'Item-1',
		supplierId: 'SP-001',
		price: 123.49,
		priceTier: 'EMERGENCY',
		percentage: 1.25,
	},
	{
		itemId: 'Item-1',
		supplierId: 'SP-001',
		price: 99.75,
		priceTier: 'OVER_DUE',
		percentage: 1,
	},
	{
		itemId: 'Item-1',
		supplierId: 'SP-001',
		price: 99.75,
		priceTier: 'DAILY',
		percentage: 0.9,
	},
	{
		itemId: 'Item-1',
		supplierId: 'SP-002',
		price: 120,
		priceTier: 'EMERGENCY',
		percentage: 1.25,
	},
	{
		itemId: 'Item-2',
		supplierId: 'SP-001',
		price: 80,
		priceTier: 'EMERGENCY',
		percentage: 1.25,
	},
	{
		itemId: 'Item-2',
		supplierId: 'SP-002',
		price: 78,
		priceTier: 'EMERGENCY',
		percentage: 1.25,
	},
]

export const stocks: Stock[] = [
	{
		warehouseId: 'WH-001',
		supplierId: 'SP-001',
		itemId: 'Item-1',
		quantity: 40,
	},
	{
		warehouseId: 'WH-001',
		supplierId: 'SP-002',
		itemId: 'Item-1',
		quantity: 250,
	},
	{
		warehouseId: 'WH-002',
		supplierId: 'SP-001',
		itemId: 'Item-2',
		quantity: 80,
	},
	{
		warehouseId: 'WH-003',
		supplierId: 'SP-002',
		itemId: 'Item-2',
		quantity: 90,
	},
]

export const customerCredits: CustomerCredit[] = [
	{
		customerId: 'CT-0001',
		creditLimit: 3000,
	},
	{
		customerId: 'CT-0002',
		creditLimit: 35000,
	},
]
