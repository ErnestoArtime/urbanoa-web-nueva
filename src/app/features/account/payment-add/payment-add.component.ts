import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector:'app-payment-add', imports:[FormsModule],
  template:`
    <div class="page payment-add-page">
      <h1 class="page-title">Añadir tarjeta</h1>
      <form #cardForm="ngForm" (ngSubmit)="save()" class="card-form">
        <label class="outlined-field"><span>Titular de la tarjeta</span><input [(ngModel)]="form.holder" name="holder" required /></label>
        <label class="outlined-field card-number-field"><span>Número de la tarjeta</span><img src="/assets/payment/visa.svg" alt="Visa" /><input [(ngModel)]="form.cardNumber" name="cardNumber" placeholder="4242 4242 4242 4242" required /><b aria-hidden="true">✓</b></label>
        <fieldset class="expiry-field"><legend>Caducidad</legend><select [(ngModel)]="form.month" name="month" required><option value="">Mes</option>@for(month of months;track month){<option [value]="month">{{ month }}</option>}</select><select [(ngModel)]="form.year" name="year" required><option value="">Año</option>@for(year of years;track year){<option [value]="year">{{ year }}</option>}</select></fieldset>
        <label class="outlined-field"><span>CVC (Código de seguridad)</span><input [(ngModel)]="form.cvv" name="cvv" inputmode="numeric" maxlength="4" required /></label>
        <label class="outlined-field"><span>Alias</span><input [(ngModel)]="form.alias" name="alias" /></label>
        <button type="submit" class="btn btn-primary btn-block add-button" [disabled]="cardForm.invalid">Añadir tarjeta</button>
      </form>
      <section class="secure-checkout" aria-label="Pago seguro">
        <div class="shield">✓</div><div><small>Secure Checkout</small><strong>PAYCOMET</strong><span>by Banco Sabadell</span></div>
        <div class="accepted-cards"><img src="/assets/payment/visa.svg" alt="Visa"/><img src="/assets/payment/mastercard.svg" alt="Mastercard"/></div>
      </section>
      <p class="provider-info">GERTEK SDAD. DE GESTIONES Y SERVICIOS, S.A.<br>Gregorio de la Revilla 27, 2º · 48010 Bilbao<br>soporte&#64;arinpark.eus · CIF: A95158895</p>
    </div>
  `,
  styles:[`
    .payment-add-page{max-width:640px;margin:0 auto;padding:1.2rem 1.5rem}.card-form{display:grid;gap:.85rem;margin-top:1.2rem}.outlined-field{position:relative;display:flex;align-items:center;min-height:58px;border:1px solid var(--color-primary);border-radius:6px;background:var(--color-surface)}.outlined-field>span{position:absolute;top:-.6rem;left:1rem;padding:0 .35rem;background:var(--color-surface);color:var(--color-primary);font-size:.78rem}.outlined-field input{width:100%;height:56px;padding:.8rem 1rem;border:0;background:transparent;font:inherit;outline:0}.card-number-field img{width:54px;margin-left:.8rem}.card-number-field input{padding-left:.5rem}.card-number-field b{margin-right:1rem;color:#18a638;font-size:1.4rem}.expiry-field{display:grid;grid-template-columns:1fr 1fr;padding:0;border:1px solid var(--color-primary);border-radius:6px}.expiry-field legend{margin-left:1rem;padding:0 .35rem;color:var(--color-primary);font-size:.78rem}.expiry-field select{height:56px;padding:0 1rem;border:0;background:transparent;font:inherit;color:var(--color-text-muted)}.expiry-field select+select{border-left:1px solid var(--color-primary)}.add-button{min-height:54px;font-size:1rem}.secure-checkout{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.8rem;width:max-content;max-width:100%;margin:1.8rem auto .8rem}.shield{display:grid;place-items:center;width:52px;height:58px;clip-path:polygon(50% 0,95% 18%,88% 75%,50% 100%,12% 75%,5% 18%);background:#1672e8;color:#fff;font-size:1.6rem}.secure-checkout div:nth-child(2){display:grid;grid-template-columns:1fr auto;column-gap:.8rem}.secure-checkout small{grid-column:1/-1;color:var(--color-text-muted)}.secure-checkout strong{font-size:1.35rem;letter-spacing:.08em}.secure-checkout span{align-self:center;font-size:.7rem}.accepted-cards{grid-column:2;display:flex;gap:.35rem}.accepted-cards img{height:18px;width:auto}.provider-info{text-align:center;color:#a4a7a0;font-size:.75rem;line-height:1.6}@media(max-width:520px){.payment-add-page{padding:1rem}.secure-checkout{transform:scale(.9)}}
  `]
})
export class PaymentAddComponent {
  readonly months=Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
  readonly years=Array.from({length:12},(_,i)=>String(new Date().getFullYear()+i));
  form={holder:'',cardNumber:'',month:'',year:'',cvv:'',alias:''};
  save():void{}
}
