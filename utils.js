//jsonからvalueに一致する値取得
export function getJsonData(value, json) {
  for (var word in json)  if (value == word) return json[word]
  return json["default"]
}