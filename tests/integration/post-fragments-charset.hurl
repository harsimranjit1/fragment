# Create a text fragment with charset; verify RAW returns the same text

POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`charset ok`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"

[Captures]
id: jsonpath "$.fragment.id"

GET http://localhost:8080/v1/fragments/{{id}}/raw
Accept: text/plain
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^text/plain(;.*)?$"
body == "charset ok"
