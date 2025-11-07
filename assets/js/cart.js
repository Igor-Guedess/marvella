let cart = [];
const WHATSAPP_NUMBER = '557398098269';

// --- FUNÇÕES GLOBAIS DO CARRINHO ---

function saveCart() {
    localStorage.setItem('marvellaCart', JSON.stringify(cart));
}

function loadCart() {
    const cartData = localStorage.getItem('marvellaCart');
    cart = cartData ? JSON.parse(cartData) : [];
}

// FUNÇÃO ATUALIZADA para aceitar quantidade
function addToCart(product, allProducts, quantity = 1) {
    const productInCart = cart.find(item => item.product.id === product.id);
    if (productInCart) {
        // Se o produto já existe, soma a nova quantidade
        productInCart.quantity += quantity;
    } else {
        // Se é um produto novo, adiciona com a quantidade especificada
        cart.push({ product: product, quantity: quantity });
    }
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

function generateWhatsAppMessage() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    let totalPrice = 0;
    cart.forEach(item => {
        const product = item.product;
        const price = product.discount ? product.price * (1 - (product.discountPercent / 100)) : product.price;
        const itemPrice = price * item.quantity;
        totalPrice += itemPrice;
        message += `${item.quantity}x ${product.name} - R$${formatter.format(itemPrice)}\n`;
    });
    message += `\nTotal do Pedido: R$${formatter.format(totalPrice)}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

function renderCart(allProducts) {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartCountDisplay = document.querySelector('.pro-count');
    const checkoutButton = document.getElementById('checkout-button');
    if (!cartItemsContainer) return;

    let cartHtml = '';
    let totalItems = 0;
    let totalPrice = 0;
    const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (cart.length === 0) {
        cartHtml = `<li class="sidebar-cart-item text-center">Nenhum produto adicionado ao carrinho.</li>`;
        if (checkoutButton) {
            checkoutButton.classList.add('disabled');
            checkoutButton.removeEventListener('click', generateWhatsAppMessage);
        }
    } else {
        cart.forEach(item => {
            const product = item.product;
            const price = product.discount ? product.price * (1 - (product.discountPercent / 100)) : product.price;
            const itemPrice = price * item.quantity;
            totalItems += item.quantity;
            totalPrice += itemPrice;
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
        if (checkoutButton) {
            checkoutButton.classList.remove('disabled');
            checkoutButton.addEventListener('click', generateWhatsAppMessage);
        }
    }

    if(cartItemsContainer) cartItemsContainer.innerHTML = cartHtml;
    if (cartTotalPrice) cartTotalPrice.innerHTML = `<span class="currency">R$</span>${formatter.format(totalPrice)}`;
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

// --- INICIALIZAÇÃO GLOBAL ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('assets/js/products.json');
        const allProducts = await response.json();
        
        loadCart();
        renderCart(allProducts);
        initCartSidebar(allProducts);
    } catch (error) {
        console.error("Erro ao inicializar o carrinho global:", error);
    }
});