import { connectMikrotik } from './src/lib/mikrotik.ts'

async function test() {
  const api = await connectMikrotik()
  try {
    const interfaces = await api.write('/interface/print', [
      '=.proplist=name,rx-byte,tx-byte,rx-bits-per-second,tx-bits-per-second,type',
      '?type=pppoe-in'
    ])
    console.log('PPPoE Interfaces Sample:', JSON.stringify(interfaces.slice(0, 2), null, 2))
    
    // Check if fields exist
    if (interfaces?.[0]) {
      console.log('Available keys:', Object.keys(interfaces[0]))
    }
  } catch (err) {
    console.error(err)
  } finally {
    await api.close()
  }
}

test()
