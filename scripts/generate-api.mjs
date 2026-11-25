// Кодогенерация axios-клиента из OpenAPI/Swagger веб-сервиса.
// Запуск: npm run generate-api
//
// По умолчанию спецификация берётся из запущенного Go-сервиса:
//   http://localhost:8000/swagger/doc.json
// Адрес можно переопределить переменной API_SCHEMA_URL (URL или путь к файлу):
//   API_SCHEMA_URL=./swagger.json npm run generate-api
import fs from "node:fs";
import path from "node:path";
import { generateApi } from "swagger-typescript-api";

const schemaSource =
  process.env.API_SCHEMA_URL || "http://localhost:8000/swagger/doc.json";

const isUrl = /^https?:\/\//i.test(schemaSource);
const isFile = !isUrl;

if (isFile && !fs.existsSync(path.resolve(process.cwd(), schemaSource))) {
  console.error(`Файл спецификации не найден: ${schemaSource}`);
  console.error(
    "Запустите веб-сервис на http://localhost:8000 или задайте API_SCHEMA_URL."
  );
  process.exit(1);
}

console.log(`Генерация src/api/Api.ts из ${schemaSource}`);

try {
  await generateApi({
    ...(isUrl ? { url: schemaSource } : { input: path.resolve(process.cwd(), schemaSource) }),
    output: path.resolve(process.cwd(), "src/api"),
    fileName: "Api.ts",
    httpClientType: "axios",
    generateClient: true,
    generateRouteTypes: false,
    modular: false,
    silent: false,
  });

  console.log("✓ src/api/Api.ts обновлён");
} catch (error) {
  console.error("Не удалось сгенерировать клиент из Swagger.");
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "Проверьте, что веб-сервис запущен и Swagger доступен по /swagger/doc.json."
  );
  process.exit(1);
}
