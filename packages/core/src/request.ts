// TODO: Get from manifest
const ENDPOINT = "http://localhost:4000/";

export default async function request<T>(
  name: string,
  body: object,
  isVoid: boolean
): Promise<T | void> {
  try {
    const result = await fetch(ENDPOINT + name, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!result.ok) {
      throw new Error(`Call failed with status ${result.status}`);
    }
    if (!isVoid) {
      const data = await result.json();
      return data as T;
    }
  } catch (err) {
    console.error(err);
    throw new Error("Network error");
  }
}
