# Create a plain-text fragment, then GET its RAW bytes back

POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is a fragment!`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 19

[Captures]
id: jsonpath "$.fragment.id"

GET http://localhost:8080/v1/fragments/{{id}}/raw
Accept: text/plain
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
# Don't assert exact charset; just ensure it's text/plain
[Asserts]
header "Content-Type" matches "^text/plain(;.*)?$"
body == "This is a fragment!"
