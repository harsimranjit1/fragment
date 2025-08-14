# tests/integration/lab-9-s3.hurl
# Lab 9 S3 integration: POST -> 201, GET -> 200 (text/plain, Hello S3!), DELETE -> 200, GET -> 404

# 1) POST a text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com: password1
`Hello S3!`
HTTP 201
[Captures]
url: header "Location"
[Asserts]
header "Location" exists

# 2) GET the fragment we just created
GET {{url}}
[BasicAuth]
user1@email.com: password1
HTTP 200
[Asserts]
header "Content-Type" contains "text/plain"

body == "Hello S3!"

# 3) DELETE the fragment
DELETE {{url}}
[BasicAuth]
user1@email.com: password1
HTTP 200

# 4) GET again should now 404
GET {{url}}
[BasicAuth]
user1@email.com: password1
HTTP 404
