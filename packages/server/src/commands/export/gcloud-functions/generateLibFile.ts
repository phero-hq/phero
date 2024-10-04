import { tsx } from "@phero/core"
import ts from "typescript"

export default function generateLibFile(): ts.Node[] {
  return [
    tsx.verbatim(`export function parseServiceAndFunction(req: { url: string }) {
    const { pathname } = new URL(req.url, 'http://host');
    const sanitizedPathname = pathname.endsWith('/') ? pathname.slice(0, pathname.length - 1) : pathname;

    const [functionName] = sanitizedPathname.split('/').slice(1);
    return { functionName };
}

function readBody(request: any) {
    return request.body ?? {}
}

export async function createInput(req: any, isRequestPopulated: boolean): any {
    const body = readBody(req)
    if (!isRequestPopulated) {
        return body
    }
    const { context, ...props } = body
    return {
        context: {
            ...context,
            req,
        },
        ...props,
    }
}

export async function writeResponse(
    originWhitelist: string[] | undefined,
    responseOrLazyResponse: any,
    res: any,
    req: any
) {
    res.setHeader('Content-Type', 'application/json');

    if (originWhitelist && originWhitelist.length > 0 && req.headers.origin !== undefined) {
        const isValidOrigin = originWhitelist.includes(req.headers.origin);

        if (!isValidOrigin) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Invalid origin. Maybe you forgot to add cors config to your service?' }));
            return;
        }

        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.setHeader('Vary', 'origin');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
    }

    const response = typeof responseOrLazyResponse === 'function' ? responseOrLazyResponse() : responseOrLazyResponse;

    res.statusCode = response.status;

    switch (response.status) {
        case 200:
            res.end(JSON.stringify(response.result));
            break;
        case 204:
            res.end();
            break;
        case 400:
            res.end(JSON.stringify({ errors: response.errors }));
            break;
        case 401:
            res.end(JSON.stringify({ error: response.error }));
            break;
        case 404:
            res.end(JSON.stringify({ error: response.error }));
            break;
        case 500:
            res.end(JSON.stringify({ error: response.error }));
            break;
        default:
            res.end(JSON.stringify({ error: 'Unsupported status' }));
            break;
    }
}
`),
  ]
}
