export default async function handler(req) {
  console.log('[API Test] Request received:', req.method, req.url);
  
  return new Response(
    JSON.stringify({ 
      message: 'Edge Function Working!', 
      timestamp: new Date().toISOString(),
      url: req.url
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
