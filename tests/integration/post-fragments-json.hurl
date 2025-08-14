# tests/integration/post-fragments-json.hurl
# 1) Create a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"msg":"hello","n":42}`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
# capture id so we can GET it later
[Captures]
id: jsonpath "$.fragment.id"
url: header "Location"

# 2) Fetch RAW JSON for that fragment
GET {{url}}/raw
Accept: application/json
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: application/json
[Asserts]
jsonpath "$.msg" == "hello"
jsonpath "$.n" == 42
