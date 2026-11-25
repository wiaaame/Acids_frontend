// Генерация локального CA и сертификата для HTTPS.
// Запуск: npm run certs
//
// 1. Если установлен mkcert — используется он: сертификат автоматически
//    добавляется в доверенные на компьютере.
// 2. Иначе — openssl: создаётся собственный CA (ca.crt) и серверный
//    сертификат (cert.crt) с SAN для localhost и всех IPv4-адресов машины.
//
// Полученный ca.crt нужно один раз установить на телефоне
// (Настройки → Безопасность → Установить сертификат → CA-сертификат).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// certs.local/ исключён из git правилом *.local, поэтому приватные ключи
// не попадут в репозиторий. Путь можно переопределить через CERT_DIR.
const certsDir = process.env.CERT_DIR
  ? path.resolve(process.env.CERT_DIR)
  : path.join(process.cwd(), "certs.local");
fs.mkdirSync(certsDir, { recursive: true });

const certKey = path.join(certsDir, "cert.key");
const certCrt = path.join(certsDir, "cert.crt");
const caKey = path.join(certsDir, "ca.key");
const caCrt = path.join(certsDir, "ca.crt");
const csrFile = path.join(certsDir, "cert.csr");
const configFile = path.join(certsDir, "openssl.cnf");

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} завершился с кодом ${result.status}`);
  }
};

const commandExists = (command) =>
  spawnSync(command, ["-version"], { stdio: "ignore" }).status === 0;

// Все IPv4-адреса машины (в WSL это адреса виртуального интерфейса)
const lanIPs = Object.values(os.networkInterfaces())
  .flat()
  .filter(Boolean)
  .filter((item) => item.family === "IPv4" && !item.internal)
  .map((item) => item.address);

// Дополнительные адреса (например, LAN-IP ноутбука в Windows):
// EXTRA_HOSTS=192.168.1.10,my-laptop.local npm run certs
const extraHosts = (process.env.EXTRA_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const hosts = [
  "localhost",
  "127.0.0.1",
  "::1",
  ...new Set(lanIPs),
  ...extraHosts,
];

const sanEntries = hosts
  .map((host, index) => {
    if (host.includes(":")) return `IP.${index + 1}=${host}`; // IPv6
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return `IP.${index + 1}=${host}`;
    return `DNS.${index + 1}=${host}`;
  })
  .join("\n");

if (commandExists("mkcert")) {
  console.log("Найден mkcert — создаём локально доверенный сертификат.");
  // -install может потребовать прав администратора; не прерываем выполнение
  spawnSync("mkcert", ["-install"], { stdio: "ignore" });

  run("mkcert", [
    "-key-file",
    certKey,
    "-cert-file",
    certCrt,
    ...hosts,
  ]);

  // Корневой сертификат mkcert копируем для установки на телефон
  const caroot = spawnSync("mkcert", ["-CAROOT"], { encoding: "utf8" });
  const rootCA = path.join((caroot.stdout || "").trim(), "rootCA.pem");
  if (caroot.status === 0 && fs.existsSync(rootCA)) {
    fs.copyFileSync(rootCA, caCrt);
  }
} else {
  console.log("mkcert не найден — используем openssl (собственный CA).");

  // 1. Корневой CA (создаём один раз, чтобы не менять доверие на телефоне)
  if (!fs.existsSync(caKey)) {
    run("openssl", ["genrsa", "-out", caKey, "2048"]);
  }
  if (!fs.existsSync(caCrt)) {
    run("openssl", [
      "req",
      "-x509",
      "-new",
      "-key",
      caKey,
      "-sha256",
      "-days",
      "825",
      "-out",
      caCrt,
      "-subj",
      "/CN=Acid PWA Local CA",
    ]);
  }

  // 2. Конфигурация серверного сертификата с SAN
  fs.writeFileSync(
    configFile,
    [
      "[req]",
      "distinguished_name=dn",
      "req_extensions=req_ext",
      "prompt=no",
      "",
      "[dn]",
      "CN=localhost",
      "",
      "[req_ext]",
      "subjectAltName=@alt_names",
      "",
      "[alt_names]",
      sanEntries,
      "",
    ].join("\n")
  );

  // 3. Ключ сервера, запрос на сертификат и подпись нашим CA
  if (!fs.existsSync(certKey)) {
    run("openssl", ["genrsa", "-out", certKey, "2048"]);
  }
  run("openssl", [
    "req",
    "-new",
    "-key",
    certKey,
    "-out",
    csrFile,
    "-config",
    configFile,
  ]);
  run("openssl", [
    "x509",
    "-req",
    "-in",
    csrFile,
    "-CA",
    caCrt,
    "-CAkey",
    caKey,
    "-CAcreateserial",
    "-out",
    certCrt,
    "-days",
    "825",
    "-sha256",
    "-extfile",
    configFile,
    "-extensions",
    "req_ext",
  ]);
}

const certsLabel = path.relative(process.cwd(), certsDir) || "certs.local";
const instructions = `Сертификаты созданы в каталоге ${certsLabel}/:
  cert.key, cert.crt — ключ и сертификат для HTTPS-сервера
  ca.crt             — корневой сертификат для установки на телефон

Адреса, для которых выпущен сертификат:
  ${hosts.join(", ")}

Установка CA на телефон (Android):
  Настройки → Безопасность → Шифрование и учётные данные →
  Установить сертификат → Сертификат CA → выбрать ${certsLabel}/ca.crt

Запуск HTTPS reverse-proxy:
  npm run build
  npm run serve:https
  Открыть на телефоне: https://<IP-ноутбука>:8443
`;

fs.writeFileSync(path.join(certsDir, "README.txt"), instructions);
console.log(instructions);
