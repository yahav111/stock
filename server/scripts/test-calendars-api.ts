/**
 * Test script to check if we're getting data from Finnhub and Polygon APIs
 * Run with: npx tsx scripts/test-calendars-api.ts
 */
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const POLYGON_BASE_URL = 'https://api.polygon.io';
const FMP_BASE_URL = 'https://financialmodelingprep.com';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;

async function testFinnhubEconomic() {
  console.log('\n🔍 Testing Finnhub Economic Calendar...');
  console.log('='.repeat(60));
  
  if (!FINNHUB_API_KEY) {
    console.log('❌ FINNHUB_API_KEY not found in .env');
    return;
  }

  try {
    // Test without from/to (free tier)
    const url1 = `${FINNHUB_BASE_URL}/calendar/economic`;
    console.log(`\n📡 Test 1: Without from/to (Free tier)`);
    console.log(`URL: ${url1}`);
    
    const response1 = await axios.get(url1, {
      params: { token: FINNHUB_API_KEY },
      timeout: 10000,
    });
    
    console.log(`Status: ${response1.status}`);
    console.log(`Response:`, JSON.stringify(response1.data, null, 2));
    
    // Test with from/to
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`\n📡 Test 2: With from/to (${from} to ${to})`);
    const response2 = await axios.get(url1, {
      params: { 
        token: FINNHUB_API_KEY,
        from,
        to,
      },
      timeout: 10000,
    });
    
    console.log(`Status: ${response2.status}`);
    console.log(`Response:`, JSON.stringify(response2.data, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testFinnhubIPO() {
  console.log('\n🔍 Testing Finnhub IPO Calendar...');
  console.log('='.repeat(60));
  
  if (!FINNHUB_API_KEY) {
    console.log('❌ FINNHUB_API_KEY not found in .env');
    return;
  }

  try {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `${FINNHUB_BASE_URL}/calendar/ipo`;
    console.log(`URL: ${url}`);
    console.log(`Params: from=${from}, to=${to}`);
    
    const response = await axios.get(url, {
      params: { 
        token: FINNHUB_API_KEY,
        from,
        to,
      },
      timeout: 10000,
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testPolygonIPO() {
  console.log('\n🔍 Testing Polygon IPO Calendar...');
  console.log('='.repeat(60));
  
  if (!POLYGON_API_KEY) {
    console.log('❌ POLYGON_API_KEY not found in .env');
    return;
  }

  try {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Try different Polygon endpoints
    const endpoints = [
      '/v2/reference/ipos',
      '/v3/reference/ipos',
      '/v2/aggs/grouped/locale/us/market/stocks',
    ];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${POLYGON_BASE_URL}${endpoint}`;
        console.log(`\n📡 Trying: ${url}`);
        
        const params: Record<string, string> = { 
          apiKey: POLYGON_API_KEY,
        };
        
        if (endpoint.includes('ipos')) {
          params['ipo_date.gte'] = from;
          params['ipo_date.lte'] = to;
          params['order'] = 'asc';
          params['limit'] = '100';
        }
        
        const response = await axios.get(url, {
          params,
          timeout: 10000,
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`Response keys:`, Object.keys(response.data || {}));
        if (response.data.results) {
          console.log(`Results count: ${Array.isArray(response.data.results) ? response.data.results.length : 'N/A'}`);
        }
        console.log(`Sample:`, JSON.stringify(response.data, null, 2).substring(0, 500));
        break; // If successful, stop trying
      } catch (err: any) {
        console.log(`❌ ${endpoint}: ${err.response?.status || err.message}`);
      }
    }
    
    // Also try the corporate actions endpoint
    try {
      const url = `${POLYGON_BASE_URL}/v3/reference/tickers`;
      console.log(`\n📡 Trying corporate actions: ${url}`);
      const response = await axios.get(url, {
        params: { 
          apiKey: POLYGON_API_KEY,
          market: 'stocks',
          active: 'true',
          limit: '10',
        },
        timeout: 10000,
      });
      console.log(`✅ Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
    } catch (err: any) {
      console.log(`❌ Corporate actions: ${err.response?.status || err.message}`);
    }
    
    return; // Skip the old code below
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.results && Array.isArray(response.data.results)) {
      console.log(`\n✅ Found ${response.data.results.length} IPO events`);
      if (response.data.results.length > 0) {
        console.log(`\nFirst event sample:`, JSON.stringify(response.data.results[0], null, 2));
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testFMPEconomic() {
  console.log('\n🔍 Testing FMP Economic Calendar...');
  console.log('='.repeat(60));
  
  if (!FMP_API_KEY) {
    console.log('❌ FMP_API_KEY not found in .env');
    return;
  }

  try {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `${FMP_BASE_URL}/stable/economic-calendar`;
    console.log(`URL: ${url}`);
    console.log(`Params: from=${from}, to=${to}`);
    
    const response = await axios.get(url, {
      params: { 
        apikey: FMP_API_KEY,
        from,
        to,
      },
      timeout: 10000,
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
    console.log(`Response length: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`\nFirst event sample:`, JSON.stringify(response.data[0], null, 2));
    } else {
      console.log(`Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testFMPIPO() {
  console.log('\n🔍 Testing FMP IPO Calendar...');
  console.log('='.repeat(60));
  
  if (!FMP_API_KEY) {
    console.log('❌ FMP_API_KEY not found in .env');
    return;
  }

  try {
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `${FMP_BASE_URL}/stable/ipos-calendar`;
    console.log(`URL: ${url}`);
    console.log(`Params: from=${from}, to=${to}`);
    
    const response = await axios.get(url, {
      params: { 
        apikey: FMP_API_KEY,
        from,
        to,
      },
      timeout: 10000,
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
    console.log(`Response length: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`\nFirst event sample:`, JSON.stringify(response.data[0], null, 2));
    } else {
      console.log(`Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function main() {
  console.log('🚀 Testing Calendar APIs');
  console.log('='.repeat(60));
  console.log(`FINNHUB_API_KEY: ${FINNHUB_API_KEY ? '✅ Found' : '❌ Not found'}`);
  console.log(`POLYGON_API_KEY: ${POLYGON_API_KEY ? '✅ Found' : '❌ Not found'}`);
  console.log(`FMP_API_KEY: ${FMP_API_KEY ? '✅ Found' : '❌ Not found'}`);
  
  console.log('\n📊 Testing FMP (Primary)...');
  await testFMPEconomic();
  await testFMPIPO();
  
  console.log('\n📊 Testing Finnhub (Fallback)...');
  await testFinnhubEconomic();
  await testFinnhubIPO();
  await testPolygonIPO();
  
  console.log('\n✅ Testing complete!');
}

main().catch(console.error);

