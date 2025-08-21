import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON error responses to preserve special fields
    try {
      const errorData = JSON.parse(text);
      console.log("🔍 Parsed error data:", errorData);
      
      // Instead of modifying Error object, create a plain object that acts like an error
      const error = {
        name: 'Error',
        message: errorData.message || `${res.status}: ${text}`,
        details: errorData.details,
        unsatisfiedDependencies: errorData.unsatisfiedDependencies,
        isDependencyError: errorData.isDependencyError,
        status: res.status,
        stack: new Error().stack
      };
      
      console.log("🔍 Created error object:", error);
      console.log("🔍 isDependencyError check:", error.isDependencyError);
      
      throw error;
    } catch (parseError) {
      console.log("🔍 JSON parse failed:", parseError);
      // If JSON parsing fails, throw the original text
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
