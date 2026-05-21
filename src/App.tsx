// export default function App() {
// 	return (
// 		<main className='min-h-screen bg-slate-100 p-6'>
// 			<h1 className='text-3xl font-bold text-slate-900'>
// 				Salmon Allocation Console
// 			</h1>
// 		</main>
// 	)
// }
import { useMemo, useState } from 'react'
import { autoAllocate } from './allocation'
import { customerCredits, orders, prices, stocks } from './data'

export default function App() {
	const [keyword, setKeyword] = useState('')

	const result = useMemo(() => {
		return autoAllocate(orders, stocks, prices, customerCredits)
	}, [])

	const filteredAllocation = useMemo(() => {
		const word = keyword.toLowerCase().trim()

		if (!word) return result.allocations

		return result.allocations.filter((row) => {
			return [
				row.order,
				row.subOrder,
				row.customerId,
				row.itemId,
				row.warehouseId,
				row.supplierId,
				row.reason,
			]
				.join(' ')
				.toLowerCase()
				.includes(word)
		})
	}, [keyword, result.allocations])

	const totalAllocated = result.allocations.reduce(
		(sum, row) => sum + row.allocatedQty,
		0,
	)
	const totalAmount = result.allocations.reduce(
		(sum, row) => sum + row.amount,
		0,
	)
	return (
		<main className='min-h-screen bg-slate-100 p-6 text-slate-900'>
			<section className='mx-auto max-w-7xl space-y-6'>
				<div>
					<h1 className='text-3xl font-bold'>Salmon Store</h1>
				</div>
				<div className='grid gap-4 md:grid-cols-3'>
					<SummaryCard
						title='Orders'
						value={orders.length.toString()}
					/>
					<SummaryCard
						title='Allocated QTY'
						value={totalAllocated.toFixed(2)}
					/>
					<SummaryCard
						title='Allocated Amount'
						value={totalAmount.toFixed(2)}
					/>
				</div>
				<div className='rounded-2xl bg-white p-4 shadow'>
					<label className='text-sm font-medium text-slate-700'>
						Search order / customer / warehouse / supplier
					</label>
					<input
						className='mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500'
						value={keyword}
						onChange={(event) => setKeyword(event.target.value)}
					/>
				</div>
				<div className='overflow-hidden rounded-2xl bg-white shadow'>
					<div className='border-b border-slate-200 p-4'>
						<h2 className='text-xl font-bold'>Allocation Result</h2>
					</div>
					{/* table */}
					<div className='max-h-[600px] overflow-auto'>
						<table className='w-full min-w-[1100px] text-left text-sm'>
							<thead className='sticky top-0 bg-slate-200'>
								<tr>
									<Th>Order</Th>
									<Th>Sub Order</Th>
									<Th>Customer</Th>
									<Th>Item</Th>
									<Th>Warehouse</Th>
									<Th>Supplier</Th>
									<Th>Allocated Qty</Th>
									<Th>Unit Price</Th>
									<Th>Amount</Th>
									<Th>Status</Th>
								</tr>
							</thead>
							<tbody>
								{filteredAllocation.map((row, index) => (
									<tr
										key={`${row.subOrder}-${index}`}
										className='border-t'
									>
										<Td>{row.order}</Td>
										<Td>{row.subOrder}</Td>
										<Td>{row.customerId}</Td>
										<Td>{row.itemId}</Td>
										<Td>{row.warehouseId}</Td>
										<Td>{row.supplierId}</Td>
										<Td>{row.allocatedQty.toFixed(2)}</Td>
										<Td>{row.unitPrice.toFixed(2)}</Td>
										<Td>{row.amount.toFixed(2)}</Td>
										<Td>{row.reason}</Td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</main>
	)
}

function SummaryCard(props: { title: string; value: string }) {
	return (
		<div className='rounded-2xl bg-white p-5 shadow'>
			<p className='text-sm text-slate-500'>{props.title}</p>
			<p className='mt-2 text-3xl font-bold'>{props.value}</p>
		</div>
	)
}

function Th(props: { children: React.ReactNode }) {
	return <th className='px-4 py-3 font-semibold'>{props.children}</th>
}

function Td(props: { children: React.ReactNode }) {
	return <td className='px-4 py-3'>{props.children}</td>
}
