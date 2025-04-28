import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Log request
  console.log(`API Request: ${method} ${url}`, data ? data : '');
  
  const requestStart = Date.now();
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Clone the response to read it twice (once for logging, once for returning)
  const resClone = res.clone();
  
  await throwIfResNotOk(res);
  
  try {
    // Try to parse response as JSON for logging
    const responseData = await resClone.json();
    const requestTime = Date.now() - requestStart;
    console.log(`API Response (${requestTime}ms): ${method} ${url}`, {
      status: res.status,
      statusText: res.statusText,
      data: responseData
    });
  } catch (e) {
    // If it's not JSON, just log the status
    const requestTime = Date.now() - requestStart;
    console.log(`API Response (${requestTime}ms): ${method} ${url}`, {
      status: res.status,
      statusText: res.statusText,
      data: 'Non-JSON response'
    });
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`API Query Request: GET ${url}`);
    
    const requestStart = Date.now();
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`API Query Response (${Date.now() - requestStart}ms): GET ${url}`, {
        status: 401,
        statusText: "Unauthorized",
        data: null
      });
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    console.log(`API Query Response (${Date.now() - requestStart}ms): GET ${url}`, {
      status: res.status,
      statusText: res.statusText,
      data
    });
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
