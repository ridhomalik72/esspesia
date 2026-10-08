/* =========================================================
   LOADER
========================================================= */

window.addEventListener("load", () => {

    document.body.classList.add("loaded");

});



/* =========================================================
   NAVBAR SCROLL
========================================================= */

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        navbar.classList.add("scrolled");

    } else {

        navbar.classList.remove("scrolled");

    }

});



/* =========================================================
   MOBILE MENU
========================================================= */

const menuToggle = document.getElementById("menuToggle");

const mobileMenu = document.getElementById("mobileMenu");


menuToggle.addEventListener("click", () => {

    mobileMenu.classList.toggle("show");

});


document.querySelectorAll(".mobile-menu a").forEach(link => {

    link.addEventListener("click", () => {

        mobileMenu.classList.remove("show");

    });

});



/* =========================================================
   SCROLL REVEAL
========================================================= */

const revealElements = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right"
);


const revealObserver = new IntersectionObserver(

    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("active");

                revealObserver.unobserve(entry.target);

            }

        });

    },

    {
        threshold: 0.12
    }

);


revealElements.forEach((element) => {

    revealObserver.observe(element);

});



/* =========================================================
   STAGGER ANIMATION
========================================================= */

const grids = document.querySelectorAll(
    ".category-grid, .scoop-grid, .flavor-grid, .potong-flavors, .option-grid, .extra-grid, .event-packages, .testimonial-grid, .faq-list"
);


grids.forEach(grid => {

    const cards = grid.children;

    Array.from(cards).forEach((card, index) => {

        card.style.transitionDelay = `${index * 80}ms`;

    });

});



/* =========================================================
   PENGATURAN TOKO  (EDIT DI SINI)
========================================================= */

/* Nomor WhatsApp toko, format internasional tanpa + / spasi.
   Contoh: 6281234567890 (08123456789 -> 628123456789) */
const WHATSAPP_NUMBER = "6289519038875";

/* Persentase DP untuk Paket Hajatan */
const PACKAGE_DP_PERCENT = 50;

/* Minimal H- untuk pemesanan Paket Hajatan */
const PACKAGE_MIN_DAYS = 7;

const CART_STORAGE_KEY = "esspesia_cart_v1";



/* =========================================================
   HELPERS
========================================================= */

const rupiah = (value) =>
    "Rp " + Number(value).toLocaleString("id-ID");


function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = String(text);

    return div.innerHTML;

}


function syncScrollLock() {

    const anyOpen = document.querySelector(
        ".modal.show, .cart-page.show"
    );

    document.body.style.overflow = anyOpen ? "hidden" : "";

}


function openOverlay(id) {

    const el = document.getElementById(id);

    el.classList.add("show");

    el.setAttribute("aria-hidden", "false");

    syncScrollLock();

}


function closeModal(id) {

    const el = document.getElementById(id);

    el.classList.remove("show");

    el.setAttribute("aria-hidden", "true");

    syncScrollLock();

}


let toastTimer;

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2200);

}


/* tutup via tombol [data-close] dan klik area gelap */

document.querySelectorAll("[data-close]").forEach(button => {

    button.addEventListener("click", () => {

        closeModal(button.dataset.close);

    });

});


document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {

            closeModal(modal.id);

        }

    });

});



/* =========================================================
   CART STATE
========================================================= */

let cart = loadCart();


function loadCart() {

    try {

        const raw = localStorage.getItem(CART_STORAGE_KEY);

        const data = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(data)) return [];

        return data
            .filter(item =>
                item &&
                typeof item.name === "string" &&
                Number(item.price) > 0 &&
                Number(item.qty) > 0
            )
            .map(item => ({
                key: String(item.key),
                id: String(item.id),
                name: item.name,
                price: Number(item.price),
                type: String(item.type || "scoop"),
                note: String(item.note || ""),
                qty: Math.min(99, Math.floor(Number(item.qty)))
            }));

    } catch (error) {

        return [];

    }

}


function saveCart() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {
        /* penyimpanan tidak tersedia, keranjang tetap jalan di memori */
    }

}


function cartCountTotal() {

    return cart.reduce((sum, item) => sum + item.qty, 0);

}


function addToCart(product, qty, note) {

    const key = `${product.id}::${note.trim().toLowerCase()}`;

    const existing = cart.find(item => item.key === key);

    if (existing) {

        existing.qty = Math.min(99, existing.qty + qty);

    } else {

        cart.push({
            key,
            id: product.id,
            name: product.name,
            price: product.price,
            type: product.type,
            note: note.trim(),
            qty
        });

    }

    saveCart();

    renderCart();

    const navCart = document.getElementById("cartOpen");

    navCart.classList.remove("bump");

    void navCart.offsetWidth;

    navCart.classList.add("bump");

}


function changeQty(key, delta) {

    const item = cart.find(entry => entry.key === key);

    if (!item) return;

    item.qty = Math.min(99, item.qty + delta);

    if (item.qty <= 0) {

        cart = cart.filter(entry => entry.key !== key);

    }

    saveCart();

    renderCart();

}


function removeItem(key) {

    cart = cart.filter(entry => entry.key !== key);

    saveCart();

    renderCart();

}


/* =========================================================
   HITUNG TOTAL
   - Paket Hajatan  : bayar DP 50% dulu, pelunasan H-1
   - Produk lainnya : bayar penuh
========================================================= */

function calculateTotals() {

    let packageSubtotal = 0;

    let otherSubtotal = 0;

    cart.forEach(item => {

        const line = item.price * item.qty;

        if (item.type === "package") {

            packageSubtotal += line;

        } else {

            otherSubtotal += line;

        }

    });

    const subtotal = packageSubtotal + otherSubtotal;

    const packageDP = Math.round(
        packageSubtotal * PACKAGE_DP_PERCENT / 100
    );

    return {
        packageSubtotal,
        otherSubtotal,
        subtotal,
        packageDP,
        packageRemaining: packageSubtotal - packageDP,
        payNow: otherSubtotal + packageDP,
        hasPackage: packageSubtotal > 0
    };

}


const TYPE_ICON = {
    scoop: "🍨",
    potong: "🍫",
    extra: "🌈",
    package: "🎉"
};


function renderCart() {

    if (window.cartBarReady) updateCartBar();

    /* badge navbar */

    const badge = document.getElementById("cartCount");

    const total = cartCountTotal();

    badge.textContent = total > 99 ? "99+" : total;

    badge.classList.toggle("show", total > 0);


    /* daftar item */

    const list = document.getElementById("cartList");

    const summary = document.getElementById("cartSummary");

    if (cart.length === 0) {

        summary.hidden = true;

        list.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🍨</div>
                <h3>Keranjang masih kosong</h3>
                <p>Pilih ice scoop, ice potong, atau paket hajatan favoritmu dulu.</p>
                <button type="button" class="cart-order" id="cartBrowse">
                    Lihat Menu
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;

        document
            .getElementById("cartBrowse")
            .addEventListener("click", () => {

                closeModal("cartPage");

                document
                    .getElementById("scoop")
                    .scrollIntoView({ behavior: "smooth" });

            });

        return;

    }

    summary.hidden = false;

    list.innerHTML = cart.map(item => `
        <article class="cart-item" data-key="${escapeHTML(item.key)}">

            <div class="cart-item-icon">${TYPE_ICON[item.type] || "🍨"}</div>

            <div class="cart-item-info">

                <h4>${escapeHTML(item.name)}</h4>

                <span class="cart-item-price">
                    ${rupiah(item.price)}
                    ${item.type === "package" ? "<em>DP " + PACKAGE_DP_PERCENT + "%</em>" : ""}
                </span>

                ${item.note
                    ? `<p class="cart-item-note"><i class="fa-regular fa-note-sticky"></i> ${escapeHTML(item.note)}</p>`
                    : ""}

            </div>

            <div class="cart-item-side">

                <div class="qty-control small">

                    <button type="button" data-act="minus" aria-label="Kurangi">
                        <i class="fa-solid fa-minus"></i>
                    </button>

                    <span>${item.qty}</span>

                    <button type="button" data-act="plus" aria-label="Tambah">
                        <i class="fa-solid fa-plus"></i>
                    </button>

                </div>

                <strong>${rupiah(item.price * item.qty)}</strong>

                <button type="button" class="cart-remove" data-act="remove" aria-label="Hapus item">
                    <i class="fa-regular fa-trash-can"></i>
                </button>

            </div>

        </article>
    `).join("");


    /* ringkasan */

    const t = calculateTotals();

    let rows = "";

    if (t.otherSubtotal > 0) {

        rows += `<div><span>Ice Scoop / Potong / Extra</span><strong>${rupiah(t.otherSubtotal)}</strong></div>`;

    }

    if (t.hasPackage) {

        rows += `<div><span>Paket Hajatan</span><strong>${rupiah(t.packageSubtotal)}</strong></div>`;

        rows += `<div class="sub"><span>DP ${PACKAGE_DP_PERCENT}% dibayar sekarang</span><strong>${rupiah(t.packageDP)}</strong></div>`;

        rows += `<div class="sub"><span>Pelunasan H-1</span><strong>${rupiah(t.packageRemaining)}</strong></div>`;

    }

    rows += `<div class="total"><span>Total bayar sekarang</span><strong>${rupiah(t.payNow)}</strong></div>`;

    if (t.hasPackage) {

        rows += `<p class="summary-note"><i class="fa-solid fa-truck"></i> Harga paket belum termasuk ongkir.</p>`;

    }

    document.getElementById("cartSummaryRows").innerHTML = rows;

}


/* aksi di dalam daftar keranjang (event delegation) */

document.getElementById("cartList").addEventListener("click", (event) => {

    const button = event.target.closest("[data-act]");

    if (!button) return;

    const key = button.closest(".cart-item").dataset.key;

    if (button.dataset.act === "plus") changeQty(key, 1);

    if (button.dataset.act === "minus") changeQty(key, -1);

    if (button.dataset.act === "remove") removeItem(key);

});


document.getElementById("cartClear").addEventListener("click", () => {

    if (confirm("Kosongkan semua isi keranjang?")) {

        cart = [];

        saveCart();

        renderCart();

    }

});


document.getElementById("cartOpen").addEventListener("click", () => {

    renderCart();

    openOverlay("cartPage");

});



/* =========================================================
   ADD TO CART MODAL
========================================================= */

const addState = { product: null };

const addQty = document.getElementById("addQty");


function clampQty() {

    let value = parseInt(addQty.value, 10);

    if (isNaN(value) || value < 1) value = 1;

    if (value > 99) value = 99;

    addQty.value = value;

    return value;

}


function updateAddPrice() {

    if (!addState.product) return;

    const total = addState.product.price * clampQty();

    document.getElementById("addPrice").textContent =
        rupiah(addState.product.price) +
        (clampQty() > 1 ? `  ×  ${addQty.value} = ${rupiah(total)}` : "");

}


function openAddModal(button) {

    const product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: Number(button.dataset.price),
        type: button.dataset.type,
        hint: button.dataset.hint || ""
    };

    addState.product = product;

    const labels = {
        scoop: "ICE SCOOP",
        potong: "ICE POTONG",
        extra: "EXTRA",
        package: "PAKET HAJATAN"
    };

    document.getElementById("addIcon").textContent =
        TYPE_ICON[product.type] || "🍨";

    document.getElementById("addLabel").textContent =
        labels[product.type] || "PILIHAN KAMU";

    document.getElementById("addName").textContent = product.name;

    document.getElementById("addNote").value = "";

    document.getElementById("addNote").placeholder =
        product.hint || "Catatan (opsional)";

    addQty.value = 1;

    updateAddPrice();

    openOverlay("addModal");

}


document.querySelectorAll("[data-add]").forEach(button => {

    button.addEventListener("click", () => openAddModal(button));

});


document.getElementById("addMinus").addEventListener("click", () => {

    addQty.value = clampQty() - 1;

    updateAddPrice();

});

document.getElementById("addPlus").addEventListener("click", () => {

    addQty.value = clampQty() + 1;

    updateAddPrice();

});

addQty.addEventListener("input", updateAddPrice);


document.getElementById("addConfirm").addEventListener("click", () => {

    if (!addState.product) return;

    addToCart(
        addState.product,
        clampQty(),
        document.getElementById("addNote").value
    );

    closeModal("addModal");

    showToast(`${addState.product.name} masuk keranjang`);

});



/* =========================================================
   CHECKOUT
========================================================= */

const orderForm = document.getElementById("orderForm");

const stepDetail = document.getElementById("stepDetail");

const stepPay = document.getElementById("stepPay");

let currentOrder = null;


function toDateInputValue(date) {

    const local = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return local.toISOString().slice(0, 10);

}


function formatLongDate(value) {

    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
        "id-ID",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );

}


function showStep(step) {

    stepDetail.hidden = step !== "detail";

    stepPay.hidden = step !== "pay";

    document
        .querySelector("#checkoutModal .modal-content")
        .scrollTop = 0;

}


function clearErrors() {

    ["errName", "errDate", "errAddress"].forEach(id => {

        document.getElementById(id).textContent = "";

    });

    orderForm
        .querySelectorAll(".field")
        .forEach(field => field.classList.remove("invalid"));

}


function setError(fieldId, errorId, message) {

    document.getElementById(errorId).textContent = message;

    document.getElementById(fieldId).classList.add("invalid");

}


document.getElementById("cartOrder").addEventListener("click", () => {

    if (cart.length === 0) return;

    const t = calculateTotals();

    const dateInput = document.getElementById("orderDate");

    const today = new Date();

    const minDate = new Date(today);

    if (t.hasPackage) {

        minDate.setDate(today.getDate() + PACKAGE_MIN_DAYS);

    }

    dateInput.min = toDateInputValue(minDate);

    if (dateInput.value && dateInput.value < dateInput.min) {

        dateInput.value = "";

    }

    document.getElementById("orderDateLabel").textContent =
        t.hasPackage ? "Tanggal acara" : "Tanggal pemesanan";

    document.getElementById("dateHint").textContent =
        t.hasPackage
            ? `Paket Hajatan dipesan minimal H-${PACKAGE_MIN_DAYS} sebelum acara.`
            : "";

    clearErrors();

    showStep("detail");

    openOverlay("checkoutModal");

});


orderForm.addEventListener("submit", (event) => {

    event.preventDefault();

    clearErrors();

    const name = document.getElementById("orderName").value.trim();

    const date = document.getElementById("orderDate").value;

    const address = document.getElementById("orderAddress").value.trim();

    const note = document.getElementById("orderNote").value.trim();

    const minDate = document.getElementById("orderDate").min;

    let valid = true;

    if (!name) {

        setError("orderName", "errName", "Nama wajib diisi.");

        valid = false;

    }

    if (!date) {

        setError("orderDate", "errDate", "Tanggal wajib diisi.");

        valid = false;

    } else if (minDate && date < minDate) {

        setError(
            "orderDate",
            "errDate",
            `Tanggal paling cepat ${formatLongDate(minDate)}.`
        );

        valid = false;

    }

    if (!address) {

        setError("orderAddress", "errAddress", "Alamat wajib diisi.");

        valid = false;

    }

    if (!valid) return;

    currentOrder = {
        id: generateOrderId(),
        name,
        date,
        address,
        note,
        items: cart.map(item => ({ ...item })),
        totals: calculateTotals()
    };

    preparePayment(currentOrder);

    showStep("pay");

});


/* =========================================================
   PAYMENT + WHATSAPP
========================================================= */

function buildWhatsAppMessage(order) {

    return [
        "Halo Esspesia, saya ingin mengirim struk pesanan dan bukti pembayaran.",
        "",
        `No. Pesanan: ${order.id}`,
        `Nama: ${order.name}`,
        "",
        "Struk pesanan dan screenshot bukti pembayaran saya lampirkan di chat ini. Mohon dikonfirmasi, terima kasih!"
    ].join("\n");

}


function preparePayment(order) {

    document.getElementById("payTotal").textContent =
        rupiah(order.totals.payNow);

    document.getElementById("payNote").textContent =
        order.totals.hasPackage
            ? `Termasuk DP ${PACKAGE_DP_PERCENT}% Paket Hajatan. Pelunasan ${rupiah(order.totals.packageRemaining)} paling lambat H-1.`
            : "";

    /* reset tampilan tombol WhatsApp */

    document.getElementById("waArea").hidden = true;

    const paidButton = document.getElementById("paidButton");

    paidButton.hidden = false;

    document.getElementById("waButton").href =
        `https://wa.me/${WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(buildWhatsAppMessage(order));

}


/* fallback jika gambar QR belum ada */

const qrImage = document.getElementById("qrImage");

qrImage.addEventListener("error", () => {

    qrImage.hidden = true;

    document.getElementById("qrMissing").hidden = false;

    document.querySelector(".qr-download").hidden = true;

});


document.getElementById("paidButton").addEventListener("click", async (event) => {

    const button = event.currentTarget;

    button.disabled = true;

    await prepareReceipt(currentOrder);

    button.hidden = true;

    button.disabled = false;

    const waArea = document.getElementById("waArea");

    waArea.hidden = false;

    waArea.scrollIntoView({ behavior: "smooth", block: "center" });

});


document.getElementById("backToDetail").addEventListener("click", () => {

    showStep("detail");

});


/* =========================================================
   STRUK (gambar) + BAGIKAN KE WHATSAPP
========================================================= */

function generateOrderId() {

    const now = new Date();

    const stamp =
        String(now.getFullYear()).slice(2) +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const random = Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase();

    return `ESP-${stamp}-${random}`;

}


function loadImage(src) {

    return new Promise(resolve => {

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = () => resolve(null);

        img.src = src;

    });

}


function wrapLines(ctx, text, maxWidth) {

    const words = String(text).split(/\s+/);

    const lines = [];

    let line = "";

    words.forEach(word => {

        const test = line ? `${line} ${word}` : word;

        if (ctx.measureText(test).width > maxWidth && line) {

            lines.push(line);

            line = word;

        } else {

            line = test;

        }

    });

    if (line) lines.push(line);

    return lines.length ? lines : [""];

}


async function drawReceipt(order, withLogo) {

    if (document.fonts && document.fonts.ready) {

        await document.fonts.ready;

    }

    const W = 600;

    const P = 40;

    const SCALE = 2;

    const SANS = '"DM Sans", Arial, sans-serif';

    const SERIF = '"Playfair Display", Georgia, serif';

    const measure = document.createElement("canvas").getContext("2d");

    const logo = withLogo ? await loadImage("logo.png") : null;

    const ops = [];

    let y = 24;

    const text = (value, x, size, weight, color, align, family) => {

        ops.push({ k: "t", value, x, y, size, weight, color, align, family: family || SANS });

    };

    const rule = (dashed = true) => {

        y += 10;

        ops.push({ k: "l", y, dashed });

        y += 22;

    };

    const rows = (left, right, bold) => {

        const weight = bold ? 700 : 400;

        measure.font = `${weight} 15px ${SANS}`;

        const lines = wrapLines(measure, left, W - P * 2 - 150);

        lines.forEach((line, index) => {

            text(line, P, 15, weight, "#171717", "left");

            if (index === 0 && right) {

                text(right, W - P, 15, weight, "#171717", "right");

            }

            y += 22;

        });

    };

    const labelValue = (label, value) => {

        measure.font = `400 15px ${SANS}`;

        const lines = wrapLines(measure, value, W - P * 2 - 110);

        text(label, P, 14, 500, "#777777", "left");

        lines.forEach(line => {

            text(line, P + 110, 15, 500, "#171717", "left");

            y += 22;

        });

    };


    /* header */

    y += 6;

    if (logo) {

        ops.push({ k: "i", img: logo, x: W / 2 - 34, y, size: 68 });

        y += 68 + 28;

    } else {

        y += 8;

    }

    text("ESSPESIA", W / 2, 30, 800, "#171717", "center", SERIF);
    y += 22;

    text("ICE CREAM  •  PARONGPONG", W / 2, 11, 600, "#777777", "center");
    y += 30;

    text("STRUK PEMESANAN", W / 2, 13, 800, "#c9184a", "center");
    y += 24;

    text(order.id, W / 2, 15, 700, "#171717", "center");
    y += 20;

    text(
        new Date().toLocaleString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        }),
        W / 2, 12, 400, "#777777", "center"
    );
    y += 6;

    rule();


    /* detail pemesan */

    labelValue("Nama", order.name);
    labelValue(order.totals.hasPackage ? "Tgl. Acara" : "Tanggal", formatLongDate(order.date));
    labelValue("Alamat", order.address);
    labelValue("Catatan", order.note || "-");

    rule();


    /* item */

    order.items.forEach(item => {

        rows(`${item.name} x${item.qty}`, rupiah(item.price * item.qty), false);

        if (item.note) {

            measure.font = `400 12px ${SANS}`;

            wrapLines(measure, `Catatan: ${item.note}`, W - P * 2 - 150).forEach(line => {

                text(line, P + 12, 12, 400, "#777777", "left");

                y += 18;

            });

        }

        y += 6;

    });

    rule();


    /* total */

    const t = order.totals;

    if (t.hasPackage) {

        if (t.otherSubtotal > 0) rows("Scoop / Potong / Extra", rupiah(t.otherSubtotal), false);

        rows("Paket Hajatan", rupiah(t.packageSubtotal), false);

        rows(`DP ${PACKAGE_DP_PERCENT}% Paket`, rupiah(t.packageDP), false);

        rows("Pelunasan H-1", rupiah(t.packageRemaining), false);

        y += 4;

    }

    y += 8;

    text("TOTAL DIBAYAR", P, 14, 800, "#171717", "left");
    text(rupiah(t.payNow), W - P, 24, 800, "#c9184a", "right", SERIF);
    y += 36;

    ops.push({ k: "b", y: y - 4, text: "MENUNGGU KONFIRMASI PEMBAYARAN" });
    y += 48;

    text("Terima kasih sudah memesan!", W / 2, 14, 700, "#171717", "center");
    y += 22;

    text("Kirim struk ini dan bukti pembayaran via WhatsApp.", W / 2, 11, 400, "#777777", "center");
    y += 36;

    const H = y;


    /* gambar */

    const canvas = document.createElement("canvas");

    canvas.width = W * SCALE;

    canvas.height = H * SCALE;

    const ctx = canvas.getContext("2d");

    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(0, 0, W, H);

    const band = ctx.createLinearGradient(0, 0, W, 0);

    band.addColorStop(0, "#c9184a");

    band.addColorStop(1, "#c89b3c");

    ctx.fillStyle = band;

    ctx.fillRect(0, 0, W, 10);

    ops.forEach(op => {

        if (op.k === "t") {

            ctx.font = `${op.weight} ${op.size}px ${op.family}`;

            ctx.fillStyle = op.color;

            ctx.textAlign = op.align;

            ctx.textBaseline = "alphabetic";

            ctx.fillText(op.value, op.x, op.y + op.size);

        }

        if (op.k === "l") {

            ctx.strokeStyle = "#d9d2c5";

            ctx.lineWidth = 1.5;

            ctx.setLineDash(op.dashed ? [6, 5] : []);

            ctx.beginPath();

            ctx.moveTo(P, op.y);

            ctx.lineTo(W - P, op.y);

            ctx.stroke();

            ctx.setLineDash([]);

        }

        if (op.k === "i") {

            ctx.save();

            ctx.beginPath();

            ctx.arc(op.x + op.size / 2, op.y + op.size / 2, op.size / 2, 0, Math.PI * 2);

            ctx.clip();

            ctx.drawImage(op.img, op.x, op.y, op.size, op.size);

            ctx.restore();

        }

        if (op.k === "b") {

            ctx.font = `800 12px ${SANS}`;

            const w = ctx.measureText(op.text).width + 36;

            ctx.fillStyle = "rgba(200,155,60,.16)";

            ctx.beginPath();

            ctx.roundRect ? ctx.roundRect(W / 2 - w / 2, op.y, w, 30, 15) : ctx.rect(W / 2 - w / 2, op.y, w, 30);

            ctx.fill();

            ctx.fillStyle = "#9a7420";

            ctx.textAlign = "center";

            ctx.fillText(op.text, W / 2, op.y + 20);

        }

    });

    return canvas;

}


function canvasToBlob(canvas) {

    return new Promise((resolve, reject) => {

        try {

            canvas.toBlob(blob => {

                blob ? resolve(blob) : reject(new Error("blob kosong"));

            }, "image/png");

        } catch (error) {

            reject(error);

        }

    });

}


async function buildReceiptBlob(order) {

    try {

        return await canvasToBlob(await drawReceipt(order, true));

    } catch (error) {

        /* gambar logo bisa memblokir export jika file dibuka langsung (file://) */

        return await canvasToBlob(await drawReceipt(order, false));

    }

}


let receiptFile = null;

let receiptURL = "";


async function prepareReceipt(order) {

    receiptDownloaded = false;

    try {

        const blob = await buildReceiptBlob(order);

        receiptFile = new File([blob], `Struk-${order.id}.png`, { type: "image/png" });

        if (receiptURL) URL.revokeObjectURL(receiptURL);

        receiptURL = URL.createObjectURL(blob);

        document.getElementById("receiptPreview").src = receiptURL;

        document.querySelector(".receipt-preview").hidden = false;

        document.getElementById("downloadReceipt").hidden = false;

    } catch (error) {

        receiptFile = null;

        document.querySelector(".receipt-preview").hidden = true;

        document.getElementById("downloadReceipt").hidden = true;

    }

}


function finishOrder() {

    setTimeout(() => {

        cart = [];

        saveCart();

        renderCart();

        orderForm.reset();

        closeModal("checkoutModal");

        closeModal("cartPage");

        showToast("Pesanan dikirim. Jangan lupa kirim bukti bayar!");

    }, 400);

}


let receiptDownloaded = false;


function downloadReceipt() {

    const link = document.createElement("a");

    link.href = receiptURL;

    link.download = receiptFile.name;

    document.body.appendChild(link);

    link.click();

    link.remove();

    receiptDownloaded = true;

}


document.getElementById("downloadReceipt").addEventListener("click", () => {

    if (!receiptFile) return;

    downloadReceipt();

    showToast("Struk diunduh. Kirim ke WhatsApp bersama bukti pembayaran.");

});


/* buka WhatsApp ke nomor toko */

document.getElementById("waButton").addEventListener("click", (event) => {

    if (!receiptDownloaded) {

        const proceed = confirm(
            "Struk belum diunduh. Lanjut ke WhatsApp tanpa mengunduh struk?"
        );

        if (!proceed) {

            event.preventDefault();

            return;

        }

    }

    finishOrder();

});



/* =========================================================
   ESCAPE CLOSE MODAL
========================================================= */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        document
            .querySelectorAll(".modal.show, .cart-page.show")
            .forEach(modal => {

                modal.classList.remove("show");

                modal.setAttribute("aria-hidden", "true");

            });

        syncScrollLock();

    }

});


renderCart();



/* =========================================================
   BACK TO TOP
========================================================= */

const backTop =
    document.getElementById("backTop");


window.addEventListener("scroll", () => {

    if (window.scrollY > 600) {

        backTop.classList.add("show");

    } else {

        backTop.classList.remove("show");

    }

});


backTop.addEventListener("click", () => {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});



/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

const sections = document.querySelectorAll(
    "section[id]"
);


const navLinks = document.querySelectorAll(
    ".nav-menu a"
);


window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop =
            section.offsetTop - 180;

        const sectionHeight =
            section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
        ) {

            current = section.getAttribute("id");

        }

    });


    navLinks.forEach(link => {

        link.classList.remove("active");

        if (
            link.getAttribute("href") === `#${current}`
        ) {

            link.classList.add("active");

        }

    });

});



/* =========================================================
   IMAGE HOVER PARALLAX
========================================================= */

document
    .querySelectorAll(".hero-image-card, .product-image")
    .forEach(card => {

        card.addEventListener("mousemove", (event) => {

            const rect =
                card.getBoundingClientRect();

            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;

            const rotateY =
                ((x / rect.width) - .5) * 4;

            const rotateX =
                ((y / rect.height) - .5) * -4;

            card.style.transform =
                `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        });


        card.addEventListener("mouseleave", () => {

            card.style.transform = "";

        });

    });



/* =========================================================
   RIPPLE BUTTON
========================================================= */

document
    .querySelectorAll(
        ".btn, .product-button, .event-button, .maps-button"
    )
    .forEach(button => {

        button.addEventListener("click", function(event) {

            const ripple =
                document.createElement("span");

            ripple.classList.add("ripple");

            const rect =
                this.getBoundingClientRect();

            ripple.style.left =
                `${event.clientX - rect.left}px`;

            ripple.style.top =
                `${event.clientY - rect.top}px`;

            this.appendChild(ripple);

            setTimeout(() => {

                ripple.remove();

            }, 600);

        });

    });



/* =========================================================
   CURSOR GLOW
========================================================= */

const cursorGlow =
    document.createElement("div");

cursorGlow.className =
    "cursor-glow";

document.body.appendChild(cursorGlow);


document.addEventListener("mousemove", event => {

    cursorGlow.style.left =
        `${event.clientX}px`;

    cursorGlow.style.top =
        `${event.clientY}px`;

});



/* =========================================================
   CLOSE MOBILE MENU WHEN CLICK OUTSIDE
========================================================= */

document.addEventListener("click", event => {

    if (
        mobileMenu.classList.contains("show") &&
        !mobileMenu.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {

        mobileMenu.classList.remove("show");

    }

});



/* =========================================================
   DESIGN UPGRADE
========================================================= */

/* progress bar scroll */

const scrollProgress = document.createElement("div");

scrollProgress.className = "scroll-progress";

document.body.appendChild(scrollProgress);


function updateScrollProgress() {

    const max =
        document.documentElement.scrollHeight - window.innerHeight;

    const ratio = max > 0 ? window.scrollY / max : 0;

    scrollProgress.style.transform = `scaleX(${ratio})`;

}

window.addEventListener("scroll", updateScrollProgress, { passive: true });

updateScrollProgress();



/* sprinkles dekorasi di hero */

(function createSprinkles() {

    const hero = document.querySelector(".hero");

    if (!hero) return;

    const colors = ["#c9184a", "#c89b3c", "#567d46", "#6e3927", "#e85d86"];

    const spots = [
        [4, 14], [10, 72], [22, 90], [38, 4], [52, 94],
        [64, 8], [76, 86], [88, 18], [92, 62], [30, 48]
    ];

    spots.forEach(([top, left], index) => {

        const sprinkle = document.createElement("span");

        sprinkle.className = "sprinkle";

        sprinkle.style.top = `${top}%`;

        sprinkle.style.left = `${left}%`;

        sprinkle.style.background = colors[index % colors.length];

        sprinkle.style.setProperty("--rot", `${(index * 47) % 180}deg`);

        sprinkle.style.setProperty("--dur", `${7 + (index % 5) * 1.5}s`);

        sprinkle.style.setProperty("--delay", `${index * -0.9}s`);

        hero.appendChild(sprinkle);

    });

})();



/* bar keranjang melayang di mobile */

const cartBarEl = document.createElement("button");

cartBarEl.type = "button";

cartBarEl.className = "cart-bar";

cartBarEl.setAttribute("aria-label", "Lihat keranjang");

cartBarEl.innerHTML = `
    <span class="cart-bar-info">
        <i class="fa-solid fa-bag-shopping"></i>
        <b id="cartBarCount">0</b> item
    </span>
    <span class="cart-bar-total" id="cartBarTotal">Rp 0</span>
    <span class="cart-bar-go">
        Lihat Keranjang
        <i class="fa-solid fa-arrow-right"></i>
    </span>
`;

document.body.appendChild(cartBarEl);

cartBarEl.addEventListener("click", () => {

    document.getElementById("cartOpen").click();

});


function updateCartBar() {

    const count = cartCountTotal();

    document.getElementById("cartBarCount").textContent = count;

    document.getElementById("cartBarTotal").textContent =
        rupiah(calculateTotals().payNow);

    cartBarEl.classList.toggle("show", count > 0);

    document.body.classList.toggle("has-cart-bar", count > 0);

}

window.cartBarReady = true;

updateCartBar();