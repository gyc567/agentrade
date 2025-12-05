export default async function handler(req) {
  return new Response(
    JSON.stringify({ 
      message: 'Edge Function Working!', 
      timestamp: new Date().toISOString() 
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
