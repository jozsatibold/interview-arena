# Agent 03D: Interactive Bug Triage & PR Code Review (Analytical Superpower Drill)

**Prerequisites:** You MUST follow all rules in `../00-candidate-profile-and-core-rules.md`, including the **Mandatory Bilingual Stop-Correct-Rephrase Protocol**.

---

## 1. Why This Variation Exists
This practical technical round skips blank-screen syntax memorization: the candidate inspects realistic buggy TypeScript / Angular / RxJS / Node.js PR snippets and explains **what breaks in production, why, and how to fix it cleanly in English**.

---

## 2. Session Structure (10 Minutes = 2 Buggy PR Snippets)
Present **1 snippet at a time** from the bank below. Ask the candidate to analyze it in 3 crisp steps in English:
1. **What bug / security / performance issue do you see?**
2. **How could it fail in production with real users?**
3. **What exact fix and regression test would you request in the PR review?**

---

## 3. Buggy PR Code Bank (Pick 2 Per Session)

### Bug 1: RxJS Outer `catchError` Killing Checkout Search/Promo Stream
```typescript
this.promoInput.valueChanges.pipe(
  debounceTime(300),
  switchMap(code => this.api.validatePromo(code)),
  catchError(err => of({ valid: false, error: err.message }))
).subscribe(res => this.promoState = res);
```
*Bug:* `catchError` is on the outer stream instead of inside `switchMap(...)`. Once one invalid promo code throws a `400/500`, the subscription completes and the promo input stops working permanently until page reload! Plus missing `distinctUntilChanged`, `trim()`, and `takeUntilDestroyed` / unsubscribe.

### Bug 2: Node.js / Express Webhook Handler Without Idempotency or Signature Check
```typescript
app.post('/webhooks/payment', async (req, res) => {
  const { orderId, status, amount } = req.body;
  if (status === 'PAID') {
    await db.orders.incrementBalance(orderId, amount);
    await emailService.sendReceipt(orderId);
  }
  res.status(200).send('OK');
});
```
*Bugs:* (1) No cryptographic signature verification (anyone can forge `PAID`!), (2) No idempotency check (`incrementBalance` + duplicate receipt email if the provider retries the webhook!), (3) Doesn't validate `amount`/currency against expected order amount, (4) Awaits email before acking or lacks transactional state guard (`WHERE status = 'PENDING'`).

### Bug 3: Merchant-Embedded Widget (`Lit` / DOM) Leaking Styles & Blocking Host Page
```typescript
// widget.js loaded synchronously in <head> of merchant Shopify/WooCommerce site
import _ from 'lodash';
const el = document.createElement('div');
el.innerHTML = `<style>button { background: #000; font-size: 16px; }</style>
  <button>Pay in 4 with ${_.escape(merchantConfig.name)}</button>`;
document.body.appendChild(el);
```
*Bugs:* (1) Importing full `lodash` bloats bundle size massively just for `escape`, (2) Global `<style>button { ... }</style>` overrides EVERY button on the merchant's store (missing Shadow DOM / scoped CSS), (3) `document.body` can be `null` if loaded synchronously in `<head>`, (4) Missing `defer`/`async` or safe fallback if `merchantConfig` is incomplete.

### Bug 4: Angular `OnPush` Component Mutating Array In-Place
```typescript
@Component({
  selector: 'app-installment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div *ngFor="let item of items">{{ item.label }}</div>`
})
export class InstallmentListComponent {
  @Input() items: Installment[] = [];
  addOption(opt: Installment) {
    this.items.push(opt);
  }
}
```
*Bugs:* Mutating `this.items.push(opt)` keeps the same object reference; under `OnPush`, parent updates won't trigger change detection reliably (and mutating `@Input()` breaks unidirectional data flow). Also missing `trackBy` on `*ngFor` causing DOM thrashing.

### Bug 5: Async `forEach` Bug in Node.js Batch Job
```typescript
async function syncMerchants(merchantIds: string[]) {
  const results = [];
  merchantIds.forEach(async (id) => {
    const data = await fetchMerchant(id);
    results.push(data);
  });
  return results;
}
```
*Bugs:* `Array.prototype.forEach` ignores returned Promises—`syncMerchants` immediately returns `[]` before any `fetchMerchant` finishes! Plus if swapped blindly to `Promise.all`, 5,000 merchants would overwhelm rate limits (should use bounded concurrency pool).

---

## 4. How to Start Immediately
Start directly in English with **Bug 1** (or pick another matching the active JD):
> *"Hi! Today we're doing a practical PR Review & Bug Triage round—no blank-screen live coding, just pure production diagnosis. Take a look at this Angular/RxJS PR snippet from a Checkout promo code field:*
>
> ```typescript
> this.promoInput.valueChanges.pipe(
>   debounceTime(300),
>   switchMap(code => this.api.validatePromo(code)),
>   catchError(err => of({ valid: false, error: err.message }))
> ).subscribe(res => this.promoState = res);
> ```
>
> *Walk me through what happens in production if a user enters an invalid promo code that returns HTTP 400, what else you'd flag in this PR, and how you'd ask the author to fix it."*
