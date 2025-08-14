# 404 Test
GET http://localhost:8080/no-such-route

# Expect a 404
HTTP/1.1 404

# Your app returns JSON errors
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error" exists
jsonpath "$.error.code" == 404
jsonpath "$.error.message" isString
