// src/components/invoice/ProformaFlow.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  ArrowRight, Plus, Minus, Trash2, Printer, Save, Search,
  Percent, FileSignature, User, X, Send
} from 'lucide-react';

// ===== Utilities =====
const toFarsiNumber = (n) => new Intl.NumberFormat('fa-IR').format(Math.round(Number(n || 0)));
const toMoney = (n) => (n == null || isNaN(n) ? '—' : toFarsiNumber(n));

// "3+3+2" => نرخ تجمیعی (کامپاند) تخفیف: 1 - Π(1 - d_i)
const parseDiscountChain = (text) => {
  if (!text) return 0;
  try {
    const parts = String(text)
      .replace(/٪/g, '')
      .split('+')
      .map((p) => parseFloat(p.trim()))
      .filter((v) => !isNaN(v) && v > 0);
    if (parts.length === 0) return 0;
    const remain = parts.reduce((acc, d) => acc * (1 - d / 100), 1);
    return 1 - remain; // نرخ کل به صورت اعشاری
  } catch {
    return 0;
  }
};

const calcLine = (unit_price, qty, lineDiscountText) => {
  const q = Number(qty || 0);
  const price = Number(unit_price || 0);
  const subtotal = price * q;
  const dr = parseDiscountChain(lineDiscountText);
  const discount_amount = subtotal * dr;
  const total = subtotal - discount_amount;
  return { subtotal, discount_amount, total };
};

const calcInvoice = (items, invoiceDiscountText, taxPercent = 0) => {
  const subtotal = items.reduce((s, it) => s + (it.line_subtotal || 0), 0);
  const discount_rate = parseDiscountChain(invoiceDiscountText);
  const discount_amount = subtotal * discount_rate;
  const after_discount = subtotal - discount_amount;
  const tax_amount = after_discount * (Number(taxPercent || 0) / 100);
  const total = after_discount + tax_amount;
  return { subtotal, discount_amount, tax_amount, total };
};

// ===== Bottom Sheet افزودن آیتم (موبایل فرندلی) =====
function AddItemSheet({ open, onClose, product, onConfirm }) {
  if (!open || !product) return null;

  const units = Number(product.units_per_carton) || 1;
  const basePack = product.distributor_price != null
    ? Number(product.distributor_price)
    : Math.round((Number(product.carton_price_distributor) || 0) / units);
  const baseCarton = product.carton_price_distributor != null
    ? Number(product.carton_price_distributor)
    : (basePack * units);

  const [unitKind, setUnitKind] = useState('carton'); // carton | pack
  const [qty, setQty] = useState(1);
  const unitPrice = unitKind === 'carton' ? baseCarton : basePack;
  const line = calcLine(unitPrice, qty, '');

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* sheet */}
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 shadow-2xl">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">افزودن به سبد</div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-2">
            <div className="text-sm text-gray-600">محصول</div>
            <div className="font-medium">{product.name}</div>
            <div className="text-xs text-gray-500">کد: {product.code || '—'} • تعداد در کارتن: {units}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3">
            <button
              onClick={() => setUnitKind('carton')}
              className={`rounded-xl border px-3 py-2 text-center ${unitKind==='carton' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}
            >
              <div className="text-sm">کارتن</div>
              <div className="text-xs text-gray-600 mt-0.5">{toMoney(baseCarton)} ریال</div>
            </button>
            <button
              onClick={() => setUnitKind('pack')}
              className={`rounded-xl border px-3 py-2 text-center ${unitKind==='pack' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}
            >
              <div className="text-sm">بسته</div>
              <div className="text-xs text-gray-600 mt-0.5">{toMoney(basePack)} ریال</div>
            </button>
          </div>

          <div className="flex items-center justify-between border rounded-xl p-2">
            <span className="text-sm text-gray-600">تعداد ({unitKind==='carton'?'کارتن':'بسته'})</span>
            <div className="inline-flex items-center gap-1">
              <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={()=> setQty(q=>Math.max(1, q-1))}><Minus className="w-4 h-4" /></button>
              <input className="w-16 text-center" inputMode="numeric" value={qty} onChange={(e)=>setQty(Math.max(1, Number(e.target.value||1)))} />
              <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={()=> setQty(q=>q+1)}><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="text-gray-600">قیمت واحد</div>
            <div className="font-medium">{toMoney(unitPrice)} ریال</div>
          </div>
          <div className="flex items-center justify-between mt-1 text-sm">
            <div className="text-gray-600">مبلغ این آیتم</div>
            <div className="font-bold">{toMoney(line.total)} ریال</div>
          </div>

          <button
            onClick={() => onConfirm({ unitKind, qty, unitPrice })}
            className="w-full mt-4 bg-indigo-600 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700"
          >
            افزودن به سبد
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== انتخاب مشتری =====
function CustomerBox({ user, selectedCustomer, setSelectedCustomer }) {
  const [mode, setMode] = useState('pick'); // pick | create
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (mode !== 'pick') return;
      setLoading(true);

      const [cRes, vRes, rRes, locRes, schRes] = await Promise.all([
        supabase.from('customers')
          .select('id,name,phone,address,created_at,created_by')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('visits')
          .select('store_name, phone, address, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('reports')
          .select('location_id, location_name, created_at')
          .eq('visitor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('locations')
          .select('id, name, phone, address')
          .limit(200),
        supabase.from('schedules')
          .select('id')
          .eq('visitor_id', user.id)
          .limit(200),
      ]);

      let schedLocs = [];
      if (schRes.data?.length) {
        const ids = schRes.data.map(s=>s.id);
        const sl = await supabase.from('schedule_locations').select('location_id, schedule_id').in('schedule_id', ids);
        schedLocs = sl.data || [];
      }

      if (ignore) return;

      const byName = new Map();
      const put = (obj) => {
        const k = (obj.name || '').trim().toLowerCase();
        if (!k || byName.has(k)) return;
        byName.set(k, obj);
      };

      for (const c of (cRes.data||[])) put({ id:c.id, name:c.name, phone:c.phone, address:c.address, _src:'customers' });

      const locById = new Map((locRes.data||[]).map(l=>[String(l.id), l]));
      for (const sl of schedLocs) {
        const l = locById.get(String(sl.location_id)); if (!l) continue;
        put({ id:`loc-${l.id}`, name:l.name, phone:l.phone, address:l.address, _src:'locations' });
      }

      for (const v of (vRes.data||[])) {
        const name=(v.store_name||'').trim(); if (!name) continue;
        put({ id:`vis-${encodeURIComponent(name)}`, name, phone:v.phone, address:v.address, _src:'visits' });
      }
      for (const r of (rRes.data||[])) {
        const name=(r.location_name||'').trim(); if (!name) continue;
        put({ id:`rep-${encodeURIComponent(name)}`, name, _src:'reports' });
      }

      let merged = Array.from(byName.values());
      if (q.trim()) {
        const Q = q.trim();
        merged = merged.filter(x =>
          (x.name && x.name.includes(Q)) ||
          (x.phone && x.phone.includes(Q)) ||
          (x.address && x.address.includes(Q))
        );
      }
      setList(merged.sort((a,b)=> (a.name||'').localeCompare(b.name||'', 'fa')));
      setLoading(false);
    };
    run();
    return () => { ignore = true; };
  }, [q, mode, user.id]);

  const createCustomer = async () => {
    if (!newCust.name?.trim()) return;
    const payload = {
      name: newCust.name.trim(),
      phone: newCust.phone?.trim() || null,
      address: newCust.address?.trim() || null,
      created_by: user?.id || null,
    };
    const { data, error } = await supabase.from('customers').insert([payload]).select().single();
    if (error) { alert('خطا در ساخت مشتری'); console.error(error); return; }
    setSelectedCustomer(data);
    setNewCust({ name: '', phone: '', address: '' });
    setMode('pick');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="bg-white border rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gray-600 font-medium"><User className="w-4 h-4"/> انتخاب مشتری</div>
          <button className="text-xs text-indigo-600" onClick={() => setMode((m)=> m==='pick'?'create':'pick')}>
            {mode==='pick' ? 'افزودن جدید' : 'انتخاب از لیست'}
          </button>
        </div>
        {mode==='pick' ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-500"/>
              <input className="w-full border rounded-xl px-3 py-2" placeholder="جستجوی نام/تلفن/آدرس" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            <div className="max-h-64 overflow-auto divide-y">
              {loading ? (
                <div className="py-8 text-center text-gray-500">در حال بارگذاری…</div>
              ) : list.length===0 ? (
                <div className="py-8 text-center text-gray-500">مشتری یافت نشد</div>
              ) : (
                list.map(c => (
                  <label key={c.id} className="flex items-center justify-between py-2 cursor-pointer">
                    <div className="text-sm">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-gray-500 text-xs">{c.phone || '—'} • {c.address || '—'}</div>
                    </div>
                    <input type="radio" name="cust" checked={selectedCustomer?.id===c.id} onChange={()=>setSelectedCustomer(c)} />
                  </label>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="grid gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="نام مشتری *" value={newCust.name} onChange={(e)=>setNewCust(s=>({...s, name:e.target.value}))}/>
            <input className="border rounded-lg px-3 py-2" placeholder="تلفن" dir="ltr" value={newCust.phone||''} onChange={(e)=>setNewCust(s=>({...s, phone:e.target.value}))}/>
            <input className="border rounded-lg px-3 py-2" placeholder="آدرس" value={newCust.address||''} onChange={(e)=>setNewCust(s=>({...s, address:e.target.value}))}/>
            <div className="flex justify-end"><button onClick={createCustomer} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg">ذخیره</button></div>
          </div>
        )}
      </div>

      {selectedCustomer ? (
        <div className="bg-white border rounded-2xl p-3">
          <div className="text-sm text-gray-600 mb-2">خلاصه مشتری انتخابی</div>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">نام: </span>{selectedCustomer.name}</div>
            <div><span className="text-gray-500">تلفن: </span>{selectedCustomer.phone || '—'}</div>
            <div><span className="text-gray-500">آدرس: </span>{selectedCustomer.address || '—'}</div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-3 grid place-items-center text-gray-400">
          <span>مشتری انتخاب نشده</span>
        </div>
      )}
    </div>
  );
}

// ===== فهرست محصولات =====
function ProductPicker({ onAddClick, products, loading, onSearch, query }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          dir="rtl"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="جستجوی محصول (کد یا نام)"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="max-h-72 overflow-auto rounded-xl">
        {loading ? (
          <div className="text-center py-8 text-gray-500">در حال بارگذاری…</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">محصولی یافت نشد</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="p-2 text-right">کد</th>
                <th className="p-2 text-right">نام</th>
                <th className="p-2 text-right">قیمت بسته (پخش)</th>
                <th className="p-2 text-right">قیمت کارتن (پخش)</th>
                <th className="p-2 text-right">تعداد/کارتن</th>
                <th className="p-2">—</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="p-2">{p.code || '—'}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{toMoney(p.distributor_price)} ریال</td>
                  <td className="p-2">{toMoney(p.carton_price_distributor)} ریال</td>
                  <td className="p-2">{p.units_per_carton ?? '—'}</td>
                  <td className="p-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700"
                      onClick={() => onAddClick(p)}
                    >
                      <Plus className="w-4 h-4" />
                      افزودن
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ===== سبد =====
function CartTable({ items, setItems, onRemove }) {
  const updateItem = (idx, patch) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], ...patch };
    const c = calcLine(copy[idx].unit_price, copy[idx].qty, copy[idx].line_discount_text);
    copy[idx].line_subtotal = c.subtotal;
    copy[idx].line_discount_amount = c.discount_amount;
    copy[idx].line_total = c.total;
    setItems(copy);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">هنوز محصولی انتخاب نشده است</div>
      ) : (
        <div className="overflow-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="p-2 text-right">محصول</th>
                <th className="p-2 text-right">واحد</th>
                <th className="p-2 text-right">قیمت واحد (ریال)</th>
                <th className="p-2 text-right">تعداد</th>
                <th className="p-2 text-right">تخفیف آیتم</th>
                <th className="p-2 text-right">قبل از تخفیف</th>
                <th className="p-2 text-right">تخفیف</th>
                <th className="p-2 text-right">بعد از تخفیف</th>
                <th className="p-2">—</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.key} className="border-b last:border-b-0">
                  <td className="p-2">
                    <div className="font-medium">{it.product_name}</div>
                    <div className="text-xs text-gray-500">کد: {it.product_code} • در کارتن: {it.units_per_carton ?? '—'}</div>
                  </td>

                  <td className="p-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-lg ${it.unit_kind==='carton'?'bg-indigo-50 text-indigo-700 border border-indigo-200':'bg-gray-50 text-gray-600 border'}`}>{it.unit_kind==='carton'?'کارتن':'بسته'}</span>
                    </div>
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      className="w-28 border rounded-lg px-2 py-1"
                      value={it.unit_price}
                      onChange={(e)=> updateItem(idx, { unit_price: Math.max(0, Number(e.target.value)||0) })}
                    />
                  </td>

                  <td className="p-2">
                    <div className="inline-flex items-center gap-1 border rounded-xl">
                      <button className="px-2 py-1" onClick={() => updateItem(idx, { qty: Math.max(0, Number(it.qty || 0) - 1) })}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        inputMode="numeric"
                        className="w-20 text-center focus:outline-none"
                        value={it.qty}
                        onChange={(e) => updateItem(idx, { qty: Math.max(0, Number(e.target.value || 0)) })}
                      />
                      <button className="px-2 py-1" onClick={() => updateItem(idx, { qty: Number(it.qty || 0) + 1 })}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Percent className="w-4 h-4 text-gray-500" />
                      <input
                        dir="ltr"
                        className="w-28 rounded-lg border border-gray-300 px-2 py-1 focus:outline-none"
                        placeholder="مثلاً 3+3"
                        value={it.line_discount_text || ''}
                        onChange={(e) => updateItem(idx, { line_discount_text: e.target.value })}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      نرخ کل: {(parseDiscountChain(it.line_discount_text) * 100).toFixed(2)}%
                    </div>
                  </td>

                  <td className="p-2">{toMoney(it.line_subtotal)} ریال</td>
                  <td className="p-2">{toMoney(it.line_discount_amount)} ریال</td>
                  <td className="p-2 font-semibold">{toMoney(it.line_total)} ریال</td>

                  <td className="p-2 text-center">
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => onRemove(it.key)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== پیش‌نمایش چاپی =====
const PrintView = React.forwardRef(function PrintView({ meta, items, sums }, ref) {
  return (
    <div ref={ref} className="bg-white p-6 rounded-2xl border print:rounded-none print:border-0 print:p-0" dir="rtl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {meta?.logo_url ? (
            <img src={meta.logo_url} alt="لوگو" className="w-12 h-12 rounded-lg object-contain border" />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">پیش‌فاکتور فروش</h1>
            <div className="text-sm text-gray-600 mt-1">تاریخ: {new Date().toLocaleDateString('fa-IR')}</div>
            {meta?.number && <div className="text-sm text-gray-600">شماره: {meta.number}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{meta?.seller_name || 'شرکت شما'}</div>
          <div className="text-sm text-gray-600">{meta?.seller_address || 'نشانی شرکت'}</div>
          <div className="text-sm text-gray-600">{meta?.seller_phone || 'تلفن: —'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="font-semibold mb-2">مشخصات مشتری</div>
          <div className="text-sm">نام مشتری: {meta?.customer_name || '—'}</div>
          <div className="text-sm">تلفن: {meta?.customer_phone || '—'}</div>
          <div className="text-sm">آدرس: {meta?.customer_address || '—'}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="font-semibold mb-2">شرایط</div>
          <div className="text-sm">تخفیف کلی: {meta?.discount_text ? `${meta.discount_text} (نهایی ${(parseDiscountChain(meta.discount_text) * 100).toFixed(2)}%)` : '—'}</div>
          <div className="text-sm">مالیات: {Number(meta?.tax_percent || 0)}%</div>
          <div className="text-sm">اعتبار پیش‌فاکتور: {meta?.valid_days || 7} روز</div>
        </div>
      </div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-2 text-right">#</th>
            <th className="p-2 text-right">محصول</th>
            <th className="p-2 text-right">کد</th>
            <th className="p-2 text-right">واحد</th>
            <th className="p-2 text-right">تعداد</th>
            <th className="p-2 text-right">قیمت واحد (ریال)</th>
            <th className="p-2 text-right">تخفیف آیتم</th>
            <th className="p-2 text-right">مبلغ (ریال)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.key} className="border-b last:border-b-0">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{it.product_name}</td>
              <td className="p-2">{it.product_code || '—'}</td>
              <td className="p-2">{it.unit_kind === 'carton' ? 'کارتن' : 'بسته'}</td>
              <td className="p-2">{it.qty}</td>
              <td className="p-2">{toMoney(it.unit_price)}</td>
              <td className="p-2">{it.line_discount_text || '—'}</td>
              <td className="p-2 font-medium">{toMoney(it.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1 text-sm">
        <div>جمع جزء: {toMoney(sums.subtotal)} ریال</div>
        <div>تخفیف کلی: {toMoney(sums.discount_amount)} ریال</div>
        <div>مالیات: {toMoney(sums.tax_amount)} ریال</div>
        <div className="text-lg font-bold mt-2">مبلغ قابل پرداخت: {toMoney(sums.total)} ریال</div>
      </div>

      <div className="text-xs text-gray-500 mt-6">
        * این سند پیش‌فاکتور بوده و فاقد اعتبار مالیاتی است.
      </div>
    </div>
  );
});

// ===== صفحه اصلی =====
export default function ProformaFlow({ user, onBack }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');

  const [items, setItems] = useState([]);
  const [discountText, setDiscountText] = useState('');
  const [taxPercent, setTaxPercent] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [pendingProduct, setPendingProduct] = useState(null); // برای شیت موبایل
  const [sheetOpen, setSheetOpen] = useState(false);

  const printRef = useRef(null);

  // ===== Load products =====
  useEffect(() => {
    let ignore = false;
    const fetchProducts = async () => {
      setLoading(true);
      let q = supabase
        .from('products')
        .select('id, code, name, units_per_carton, distributor_price, carton_price_distributor, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(200);

      if (query?.trim()) q = q.or(`name.ilike.%${query}%,code.ilike.%${query}%`);

      const { data, error } = await q;
      if (!ignore) {
        if (error) { console.error(error); setProducts([]); }
        else setProducts(data || []);
        setLoading(false);
      }
    };
    fetchProducts();
    return () => { ignore = true; };
  }, [query]);

  // ===== Add (پس از Sheet) =====
  const confirmAddFromSheet = ({ unitKind, qty, unitPrice }) => {
    const p = pendingProduct; if (!p) return;
    const key = `${p.id}-${Date.now()}`;

    const units = Number(p.units_per_carton) || 1;
    const base = calcLine(unitPrice, qty, '');

    setItems((prev) => [
      ...prev,
      {
        key,
        product_id: p.id,
        product_code: p.code || null,
        product_name: p.name,
        units_per_carton: units,
        base_pack_price: p.distributor_price != null ? Number(p.distributor_price) : Math.round((Number(p.carton_price_distributor)||0) / (units || 1)),
        base_carton_price: p.carton_price_distributor != null ? Number(p.carton_price_distributor) : 0,
        unit_kind: unitKind,
        unit_price: unitPrice,
        qty,
        line_discount_text: '',
        line_subtotal: base.subtotal,
        line_discount_amount: base.discount_amount,
        line_total: base.total,
      },
    ]);

    setSheetOpen(false);
    setPendingProduct(null);
  };

  const handleRemoveItem = (key) => setItems((prev) => prev.filter((x) => x.key !== key));

  // ===== Totals =====
  const sums = useMemo(() => calcInvoice(items, discountText, taxPercent), [items, discountText, taxPercent]);

  // ===== Save to Supabase =====
  const handleSave = async () => {
    if (!user?.id) { alert('کاربر نامعتبر است'); return; }
    if (!selectedCustomer?.id) { alert('ابتدا مشتری را انتخاب یا ایجاد کنید'); return; }
    if (items.length === 0) { alert('هیچ آیتمی در پیش‌فاکتور نیست'); return; }

    // اطمینان از UUID واقعی
    let customerId = selectedCustomer?.id;
    const looksLikeRealUuid = typeof customerId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(customerId);
    if (!looksLikeRealUuid) {
      const payload = {
        name: selectedCustomer?.name || 'بدون نام',
        phone: selectedCustomer?.phone || null,
        address: selectedCustomer?.address || null,
        created_by: user.id,
      };
      const { data: created, error: cErr } = await supabase.from('customers').insert([payload]).select('id').single();
      if (cErr) { alert('خطا در ایجاد مشتری'); return; }
      customerId = created.id;
    }

    const { data: inv, error: e1 } = await supabase
      .from('invoices')
      .insert({
        customer_id: customerId,
        visitor_id: user.id,
        subtotal: sums.subtotal,
        discount_total: sums.discount_amount,
        tax_amount: sums.tax_amount,
        total_payable: sums.total,
        currency: 'IRR',
        notes: discountText ? `Invoice discount chain: ${discountText}` : null,
        status: 'draft',
      })
      .select()
      .single();

    if (e1) { console.error(e1); alert('خطا در ذخیره پیش‌فاکتور'); return; }

    const rows = items.map((it) => ({
      invoice_id: inv.id,
      product_id: it.product_id,
      product_code: it.product_code,
      product_name: it.product_name,
      units_per_carton: it.units_per_carton,
      unit_kind: it.unit_kind,
      qty: it.qty,
      unit_price: it.unit_price,
      line_subtotal: it.line_subtotal,
      line_discount: it.line_discount_amount || 0,
      line_total: it.line_total,
    }));

    const { error: e2 } = await supabase.from('invoice_items').insert(rows);
    if (e2) { console.error(e2); alert('پیش‌فاکتور ثبت شد اما درج آیتم‌ها با خطا مواجه شد'); return; }

    alert('پیش‌فاکتور به‌صورت پیش‌نویس ذخیره شد');
  };

  // ===== Print =====
  const handlePrint = () => window.print();

  // ===== Share to Office via Bale (شماره: +989981579694) =====
  const BALE_NUMBER = '+989981579694';
  const buildShareText = () => {
    const lines = [];
    lines.push('پیش‌فاکتور فروش');
    lines.push(`مشتری: ${selectedCustomer?.name || '—'}`);
    if (selectedCustomer?.phone) lines.push(`تلفن: ${selectedCustomer.phone}`);
    if (selectedCustomer?.address) lines.push(`آدرس: ${selectedCustomer.address}`);
    lines.push('--- اقلام ---');
    items.forEach((it, idx) => {
      lines.push(`${idx+1}) ${it.product_name} | ${it.unit_kind==='carton'?'کارتن':'بسته'} × ${it.qty} | واحد: ${toMoney(it.unit_price)} ریال | مبلغ: ${toMoney(it.line_total)} ریال`);
    });
    lines.push('----------------');
    lines.push(`جمع جزء: ${toMoney(sums.subtotal)} ریال`);
    lines.push(`تخفیف کلی: ${toMoney(sums.discount_amount)} ریال ${discountText?`(${discountText})`:''}`);
    lines.push(`مالیات: ${toMoney(sums.tax_amount)} ریال`);
    lines.push(`قابل پرداخت: ${toMoney(sums.total)} ریال`);
    lines.push('—');
    lines.push(`ارسال برای دفتر (بله): ${BALE_NUMBER}`);
    return lines.join('\n');
  };

  const sendToOffice = async () => {
    const text = buildShareText();

    // 1) اگر Web Share موجود بود، باز کن (روی موبایل، هدف "بله" هم نمایش داده می‌شود)
    if (navigator.share) {
      try {
        await navigator.share({ text, title: 'پیش‌فاکتور' });
        return;
      } catch (e) {
        // ادامه به fallback
      }
    }

    // 2) کپی به کلیپ‌بورد + باز کردن وب بله (لاگین کرده باشید وارد چت می‌شوید)
    try { await navigator.clipboard.writeText(text); alert('متن پیش‌فاکتور کپی شد. در بله پیست کنید.'); } catch {}
    window.open('https://web.bale.ai/', '_blank'); // fallback امن
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="hidden md:inline-flex items-center gap-1 text-gray-600 hover:text-gray-800">
            <ArrowRight className="w-5 h-5" /> بازگشت
          </button>
          <h2 className="text-xl md:text-2xl font-bold">صدور پیش‌فاکتور</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={sendToOffice} className="inline-flex items-center gap-2 bg-fuchsia-600 text-white px-3 md:px-4 py-2 rounded-xl hover:bg-fuchsia-700">
            <Send className="w-4 h-4" /> ارسال به دفتر (بله)
          </button>
          <button onClick={handleSave} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 md:px-4 py-2 rounded-xl hover:bg-emerald-700">
            <Save className="w-4 h-4" /> ذخیره پیش‌نویس
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-xl hover:bg-indigo-700">
            <Printer className="w-4 h-4" /> چاپ/دانلود
          </button>
        </div>
      </div>

      {/* مشتری */}
      <CustomerBox user={user} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />

      <div className="my-4" />

      {/* انتخاب محصول */}
      <ProductPicker
        onAddClick={(p)=>{ setPendingProduct(p); setSheetOpen(true); }}
        products={products}
        loading={loading}
        onSearch={setQuery}
        query={query}
      />

      <div className="my-4" />

      {/* سبد */}
      <CartTable items={items} setItems={setItems} onRemove={handleRemoveItem} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white border rounded-2xl p-4">
          <div className="text-sm text-gray-600 mb-2">تخفیف کلی (اختیاری)</div>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-gray-500" />
            <input
              dir="ltr"
              className="w-40 rounded-lg border border-gray-300 px-2 py-1"
              placeholder="مثلاً 3+3 یا 5"
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            نرخ نهایی: {(parseDiscountChain(discountText) * 100).toFixed(2)}%
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <div className="text-sm text-gray-600 mb-2">مالیات (٪) — اگر ندارید 0 بگذارید</div>
          <input
            dir="ltr"
            className="w-32 rounded-lg border border-gray-300 px-2 py-1"
            inputMode="numeric"
            value={taxPercent}
            onChange={(e) => setTaxPercent(Number(e.target.value || 0))}
          />
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <div className="flex flex-col items-end gap-1 text-sm">
            <div>جمع جزء: {toMoney(sums.subtotal)} ریال</div>
            <div>تخفیف کلی: {toMoney(sums.discount_amount)} ریال</div>
            <div>مالیات: {toMoney(sums.tax_amount)} ریال</div>
            <div className="text-lg font-bold mt-2">قابل پرداخت: {toMoney(sums.total)} ریال</div>
          </div>
        </div>
      </div>

      {/* پیش‌نمایش چاپی */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gray-700">
            <FileSignature className="w-5 h-5" />
            پیش‌نمایش پیش‌فاکتور
          </div>
          <button onClick={() => setItems([])} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" /> پاک‌سازی اقلام
          </button>
        </div>
        <PrintView
          ref={printRef}
          meta={{
            customer_name: selectedCustomer?.name,
            customer_phone: selectedCustomer?.phone,
            customer_address: selectedCustomer?.address,
            discount_text: discountText,
            tax_percent: taxPercent,
            seller_name: 'نام شرکت/برند',
            seller_phone: '—',
            seller_address: '—',
            valid_days: 7,
            logo_url: '/logo-dark.png', // ✔ مسیر لوگوی تیرهٔ قبلی
          }}
          items={items}
          sums={sums}
        />
      </div>

      {/* شیت افزودن آیتم (موبایل) */}
      <AddItemSheet
        open={sheetOpen}
        product={pendingProduct}
        onClose={()=>{ setSheetOpen(false); setPendingProduct(null); }}
        onConfirm={confirmAddFromSheet}
      />

      {/* استایل‌های چاپ */}
      <style>{`
        @media print {
          body { background: #fff; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          button, input, .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
