# API Contract

## Sample module
### POST /api/sample-module/search
Input:
```json
{
  "keyword": "abc",
  "page": 1,
  "pageSize": 20
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "name": "Bản ghi mẫu",
        "status": "active",
        "createdAt": "2026-03-17T00:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```
