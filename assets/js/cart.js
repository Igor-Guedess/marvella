let cart = [];
const WHATSAPP_NUMBER = '557381817294';

const _DB_PROMO_CODES = {
    '#CLIENT12': 12
};

const CartService = {
    async validateCoupon(code) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const cleanCode = code.trim().toUpperCase();
                if (_DB_PROMO_CODES.hasOwnProperty(cleanCode)) {
                    resolve({
                        valid: true,
                        discountPercent: _DB_PROMO_CODES[cleanCode],
                        message: 'Cupom aplicado!'
                    });
                } else {
                    resolve({
                        valid: false,
                        discountPercent: 0,
                        message: 'Cupom inválido.'
                    });
                }
            }, 600);
        });
    },

    calculateTotals(cartItems, discountPercent) {
        let subTotal = 0;
        cartItems.forEach(item => {
            const product = item.product;
            const price = product.discount ? product.price * (1 - (product.discountPercent / 100)) : product.price;
            subTotal += price * item.quantity;
        });

        const discountValue = subTotal * (discountPercent / 100);
        const total = subTotal - discountValue;

        return { subTotal, discountPercent, discountValue, total };
    }
};

let currentAppState = {
    discountPercent: 0,
    couponCode: ''
};

function saveCart() { localStorage.setItem('marvellaCart', JSON.stringify(cart)); }

function loadCart() {
    const cartData = localStorage.getItem('marvellaCart');
    cart = cartData ? JSON.parse(cartData) : [];
}

function addToCart(product, allProducts, quantity = 1) {
    const productInCart = cart.find(item => item.product.id === product.id);
    if (productInCart) productInCart.quantity += quantity;
    else cart.push({ product: product, quantity: quantity });
    saveCart();
    renderCart(allProducts);
}

function increaseQuantity(productId, allProducts) {
    const item = cart.find(item => item.product.id === productId);
    if (item) item.quantity++;
    saveCart();
    renderCart(allProducts);
}

function decreaseQuantity(productId, allProducts) {
    const item = cart.find(item => item.product.id === productId);
    if (item && item.quantity > 1) item.quantity--;
    saveCart();
    renderCart(allProducts);
}

function removeFromCart(productId, allProducts) {
    cart = cart.filter(item => item.product.id !== productId);
    saveCart();
    renderCart(allProducts);
}

async function applyCoupon(allProducts) {
    const input = document.getElementById('coupon-input');
    const message = document.getElementById('coupon-message');
    const btn = document.getElementById('apply-coupon-btn');
    
    if (!input || !message) return;

    const code = input.value;

    if (!code) {
        currentAppState.discountPercent = 0;
        currentAppState.couponCode = '';
        message.textContent = "";
        renderCart(allProducts);
        return;
    }

    btn.style.opacity = '0.6';
    btn.style.cursor = 'wait';
    btn.disabled = true;
    input.disabled = true;

    const result = await CartService.validateCoupon(code);

    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.disabled = false;
    input.disabled = false;

    if (result.valid) {
        currentAppState.discountPercent = result.discountPercent;
        currentAppState.couponCode = code;
        message.textContent = result.message;
        message.style.color = 'green';
    } else {
        currentAppState.discountPercent = 0;
        currentAppState.couponCode = '';
        message.textContent = result.message;
        message.style.color = 'red';
    }

    renderCart(allProducts);
}

function generateWhatsAppMessage() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totals = CartService.calculateTotals(cart, currentAppState.discountPercent);

    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';

    cart.forEach(item => {
        const product = item.product;
        const price = product.discount ? product.price * (1 - (product.discountPercent / 100)) : product.price;
        const itemPrice = price * item.quantity;
        message += `${item.quantity}x ${product.name} - R$${formatter.format(itemPrice)}\n`;
    });

    if (totals.discountPercent > 0) {
        message += `\nSubtotal: R$${formatter.format(totals.subTotal)}`;
        message += `\nCupom: ${currentAppState.couponCode}`;
        message += `\nDesconto: -R$${formatter.format(totals.discountValue)}`;
        message += `\n*Total Final: R$${formatter.format(totals.total)}*`;
    } else {
        message += `\nTotal do Pedido: R$${formatter.format(totals.total)}`;
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

function renderCart(allProducts) {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartCountDisplay = document.querySelector('.pro-count');
    const checkoutButton = document.getElementById('checkout-button');
    const couponInput = document.getElementById('coupon-input');
    
    if (!cartItemsContainer) return;

    let cartHtml = '';
    let totalItems = 0;
    const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totals = CartService.calculateTotals(cart, currentAppState.discountPercent);

    if (cart.length === 0) {
        cartHtml = `<li class="sidebar-cart-item text-center">Nenhum produto adicionado.</li>`;
        if (checkoutButton) checkoutButton.classList.add('disabled');
        currentAppState.discountPercent = 0;
        if(couponInput) couponInput.value = '';
        const msg = document.getElementById('coupon-message');
        if(msg) msg.textContent = '';
    } else {
        cart.forEach(item => {
            const product = item.product;
            const price = product.discount ? product.price * (1 - (product.discountPercent / 100)) : product.price;
            const itemPrice = price * item.quantity;
            totalItems += item.quantity;
            
            cartHtml += `
                <li class="sidebar-cart-item">
                    <a href="#" class="remove-cart" data-product-id="${product.id}"><i class="far fa-trash-alt"></i></a>
                    <a href="shop-details.html?id=${product.id}">
                        <img src="${product.thumbnail}" alt="${product.name}">
                        ${product.name}
                    </a>
                    <div class="quantity-control" data-product-id="${product.id}">
                        <button class="quantity-btn quantity-down"><i class="fas fa-minus"></i></button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn quantity-up"><i class="fas fa-plus"></i></button>
                    </div>
                    <span class="item-total"><span class="currency">R$</span>${formatter.format(itemPrice)}</span>
                </li>`;
        });
        if (checkoutButton) checkoutButton.classList.remove('disabled');
    }

    if(cartItemsContainer) cartItemsContainer.innerHTML = cartHtml;
    
    if (cartTotalPrice) {
        if (totals.discountPercent > 0 && totals.total > 0) {
            cartTotalPrice.innerHTML = `
                <span class="currency" style="color: #28a745;">R$</span><span style="color: #28a745; font-weight:bold;">${formatter.format(totals.total)}</span>
                <span style="text-decoration: line-through; color: #999; font-size: 0.9em; margin-left: 8px;">R$${formatter.format(totals.subTotal)}</span>
            `;
        } else {
            cartTotalPrice.innerHTML = `<span class="currency">R$</span>${formatter.format(totals.total)}`;
        }
    }

    if (cartCountDisplay) cartCountDisplay.textContent = totalItems.toString().padStart(2, '0');
    
    document.querySelectorAll('.remove-cart').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); removeFromCart(parseInt(e.currentTarget.dataset.productId), allProducts); }));
    document.querySelectorAll('.quantity-control .quantity-down').forEach(btn => btn.addEventListener('click', e => decreaseQuantity(parseInt(e.currentTarget.parentNode.dataset.productId), allProducts)));
    document.querySelectorAll('.quantity-control .quantity-up').forEach(btn => btn.addEventListener('click', e => increaseQuantity(parseInt(e.currentTarget.parentNode.dataset.productId), allProducts)));
}

function initCartSidebar(allProducts) {
    const sideCart = document.querySelector('.sidemenu-wrapper-cart');
    const cartClose = document.querySelector('.sidemenu-cart-close');
    const overlay = document.querySelector('.offcanvas__overlay');
    const headerCartButton = document.querySelector('.header-navigation .cart-button');
    const checkoutButton = document.getElementById('checkout-button');

    const btnCoupon = document.getElementById('apply-coupon-btn');
    if(btnCoupon) {
        const newBtn = btnCoupon.cloneNode(true);
        btnCoupon.parentNode.replaceChild(newBtn, btnCoupon);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            applyCoupon(allProducts);
        });
    }

    if (checkoutButton) {
        const newBtnCheckout = checkoutButton.cloneNode(true);
        checkoutButton.parentNode.replaceChild(newBtnCheckout, checkoutButton);
        newBtnCheckout.addEventListener('click', generateWhatsAppMessage);
    }

    const openCart = (e) => {
        if (e) e.preventDefault();
        if (sideCart) sideCart.classList.add("info-open");
        if (overlay) overlay.classList.add("overlay-open");
    };

    const closeCart = (e) => {
        if (e) e.preventDefault();
        if (sideCart) sideCart.classList.remove("info-open");
        if (overlay) overlay.classList.remove("overlay-open");
    };

    if (headerCartButton) headerCartButton.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (overlay) overlay.addEventListener('click', closeCart);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('assets/js/products.json');
        const allProducts = await response.json();
        loadCart();
        renderCart(allProducts);
        initCartSidebar(allProducts);
    } catch (error) {
        console.error("Erro ao inicializar:", error);
    }
});