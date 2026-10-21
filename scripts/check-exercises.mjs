// Verify the tutorial's changes using Go overlays. Never edit the base example.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = path.join(root, "examples/orders");
const tempRoot = fs.realpathSync(os.tmpdir());
const temporary = fs.mkdtempSync(path.join(tempRoot, "kpro-course-check-"));
const serviceFile = "internal/order/service.go";
const serviceTest = "internal/order/service_test.go";
const apiFile = "internal/httpapi/api.go";
const apiTest = "internal/httpapi/api_test.go";
const sqlFile = "internal/sqlite/schema.sql";
const sqlTest = "internal/sqlite/store_test.go";
const originals = new Map([serviceFile, serviceTest, apiFile, apiTest, sqlFile, sqlTest].map(file => [file, fs.readFileSync(path.join(sample, file), "utf8").replace(/\r\n/g, "\n")]));
let runs = 0;

function replaceOnce(text, from, to) {
  assert.equal(text.split(from).length, 2, `Expected one exact exercise edit: ${from}`);
  return text.replace(from, to);
}

function check(label, changes, packages, { fail = [] } = {}) {
  const replacements = {};
  for (const [file, contents] of Object.entries(changes)) {
    const target = path.join(temporary, `${runs}-${file.replaceAll("/", "-")}`);
    fs.writeFileSync(target, contents);
    replacements[path.join(sample, file)] = target;
  }
  const overlay = path.join(temporary, `overlay-${runs++}.json`);
  fs.writeFileSync(overlay, JSON.stringify({ Replace: replacements }));
  const result = spawnSync("go", ["test", `-overlay=${overlay}`, ...packages, "-count=1", "-timeout=3m"], {
    cwd: sample, encoding: "utf8", timeout: 240000, maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const log = result.stdout + result.stderr;
  assert.equal(result.signal, null, `${label}: interrupted\n${log}`);
  if (fail.length) {
    assert.equal(result.status, 1, `${label}: expected test failure, not success or a tool error\n${log}`);
    assert(!log.includes("[build failed]"), `${label}: expected behavioral failure, not compile failure\n${log}`);
    for (const test of fail) assert(log.includes(`--- FAIL: ${test}`), `${label}: missing expected failing test ${test}\n${log}`);
  } else {
    assert.equal(result.status, 0, `${label}: expected success\n${log}`);
  }
  console.log(`PASS: ${label}${fail.length ? " (expected behavioral failures observed)" : ""}`);
}

try {
  check("base example", {}, ["./..."]);
  check("chapter 02: removing SKU normalization", {
    [serviceFile]: replaceOnce(originals.get(serviceFile), "strings.TrimSpace(input.SKU)", 'strings.TrimSuffix(input.SKU, "")'),
  }, ["./internal/order", "-run", "^(TestCreate|TestRejectInvalidOrder)$"], { fail: ["TestCreate", "TestRejectInvalidOrder"] });

  const headerTest = originals.get(apiTest) + `
func TestHTTPNoStore(t *testing.T) {
	e := endpoint()
	created := request(e, "POST", "/orders", \`{"sku":"coffee","quantity":2}\`)
	if created.Code != 201 { t.Fatalf("create: %d", created.Code) }
	got := request(e, "GET", created.Header().Get("Location"), "")
	if got.Code != 200 || got.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("get: status=%d Cache-Control=%q", got.Code, got.Header().Get("Cache-Control"))
	}
}
`;
  check("chapter 03: new header assertion fails first", { [apiTest]: headerTest }, ["./internal/httpapi", "-run", "^TestHTTPNoStore$"], { fail: ["TestHTTPNoStore"] });
  const getStart = originals.get(apiFile).indexOf("func (a *API) get(");
  const getEnd = originals.get(apiFile).indexOf("func (a *API) cancel(");
  assert(getStart > 0 && getEnd > getStart);
  const getCode = replaceOnce(originals.get(apiFile).slice(getStart, getEnd), "\treturn c.JSON(http.StatusOK, o)", '\tc.Header().Set("Cache-Control", "no-store")\n\treturn c.JSON(http.StatusOK, o)');
  check("chapter 03: HTTP-only header change", {
    [apiTest]: headerTest,
    [apiFile]: originals.get(apiFile).slice(0, getStart) + getCode + originals.get(apiFile).slice(getEnd),
  }, ["./internal/httpapi"]);

  check("chapter 04: wiring an isolated reader", {
    [serviceTest]: replaceOnce(originals.get(serviceTest), "reader := order.New(store)", "reader := order.New(memory.New())"),
  }, ["./internal/order", "-run", "^TestServicesShareStore$"], { fail: ["TestServicesShareStore"] });

  check("chapter 07: rejecting repeated cancellation", {
    [serviceFile]: replaceOnce(originals.get(serviceFile), "// A retry returns the same state: cancelling twice is harmless.\n\t\t\treturn Cancelled, nil", '// A deliberate exercise change.\n\t\t\treturn "", ErrConflict'),
  }, ["./internal/order", "./internal/httpapi", "-run", "^(TestCancelTwice|TestHTTPJourney)$"], { fail: ["TestCancelTwice", "TestHTTPJourney"] });

  const newTests = {
    [serviceTest]: replaceOnce(replaceOnce(originals.get(serviceTest), "[]int{1, 20}", "[]int{1, 5}"), "Quantity: 21", "Quantity: 6"),
    [apiTest]: replaceOnce(replaceOnce(originals.get(apiTest), '"quantity":20', '"quantity":5'), '"quantity":21', '"quantity":6'),
    [sqlTest]: replaceOnce(originals.get(sqlTest), "{20, true}, {21, false}", "{5, true}, {6, false}"),
  };
  check("chapter 09: new requirements fail against old code", newTests, ["./internal/order", "./internal/httpapi", "./internal/sqlite"], { fail: ["TestRejectInvalidOrder", "TestHTTPFailures", "TestQuantityConstraint"] });
  const newBusiness = {
    ...newTests,
    [serviceFile]: replaceOnce(replaceOnce(originals.get(serviceFile), "input.Quantity > 20", "input.Quantity > 5"), "quantity must be 1..20", "quantity must be 1..5"),
  };
  check("chapter 09: business and HTTP pass after rule change", newBusiness, ["./internal/order", "./internal/httpapi"]);
  check("chapter 09: unchanged schema still rejects new assertion", newBusiness, ["./internal/sqlite"], { fail: ["TestQuantityConstraint"] });
  check("chapter 09: complete requirement passes all tests", {
    ...newBusiness,
    [sqlFile]: replaceOnce(originals.get(sqlFile), "quantity BETWEEN 1 AND 20", "quantity BETWEEN 1 AND 5"),
  }, ["./..."]);
  for (const [file, original] of originals) {
    assert.equal(fs.readFileSync(path.join(sample, file), "utf8").replace(/\r\n/g, "\n"), original, `Exercise modified base file: ${file}`);
  }
  console.log(`PASS: ${runs} exercise states; original sample unchanged.`);
} finally {
  // Only remove the fresh, validated directory created by this script.
  const resolved = fs.realpathSync(temporary);
  assert.equal(path.dirname(resolved), tempRoot);
  assert(path.basename(resolved).startsWith("kpro-course-check-"));
  fs.rmSync(resolved, { recursive: true });
}
