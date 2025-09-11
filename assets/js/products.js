// Objeto de mapeamento para os nomes de exibição das categorias
const CATEGORY_DISPLAY_NAMES = {
    "argila": "Argila Pura",
    "dermocare": "Dermocare",
    "puraessencia": "Pura Essência",
    "natureza": "Essência da Natureza",
    "oleos": "Óleos Puros",
    "lume": "Lume",
    "alento": "Alento",
    "duocare": "Duocare",
    "petcare": "Pet Care"
};

// Variável global para armazenar os produtos no carrinho
let cart = [];

// Variáveis de paginação
const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;

// NOVO: Número de telefone para o WhatsApp
const WHATSAPP_NUMBER = '557398098269';

// Função para buscar os dados dos produtos do JSON
async function fetchProducts() {
    try {
        const response = await fetch('assets/js/products.json');
        if (!response.ok) {
            throw new Error(`Erro ao buscar os produtos: ${response.statusText}`);
        }
        const products = await response.json();
        
        renderCategories(products);
        renderProducts(products, true);
        renderCart(products);
    } catch (error) {
        console.error('Ocorreu um erro:', error);
    }
}

// Função para renderizar as categorias do filtro (agora com seleção única)
function renderCategories(products) {
    const categoriesContainer = document.getElementById('category-list-container');
    if (!categoriesContainer) return;

    const categoryCounts = {};
    products.forEach(product => {
        const category = product.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    let categoriesHtml = '';
    for (const category in categoryCounts) {
        const count = categoryCounts[category];
        const categoryName = CATEGORY_DISPLAY_NAMES[category] || category;
        categoriesHtml += `
            <li>
                <div class="form-check">
                    <input class="form-check-input category-filter-checkbox" type="checkbox" id="check-${category}" data-category="${category}">
                    <label class="form-check-label" for="check-${category}">
                        ${categoryName}<span>${count}</span>
                    </label>
                </div>
            </li>
        `;
    }

    categoriesContainer.innerHTML = categoriesHtml;

    document.querySelectorAll('.category-filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            document.querySelectorAll('.category-filter-checkbox').forEach(otherCheckbox => {
                if (otherCheckbox !== event.target) {
                    otherCheckbox.checked = false;
                }
            });
            currentPage = 1;
            filterAndRenderProducts(products);
        });
    });
}

// Função para filtrar e renderizar produtos
function filterAndRenderProducts(products) {
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter-checkbox:checked'))
                                     .map(checkbox => checkbox.dataset.category);
    
    let filteredProducts = products;
    if (selectedCategories.length > 0) {
        filteredProducts = products.filter(product => selectedCategories.includes(product.category));
    }

    renderProducts(filteredProducts, false);
}

// Função para gerar o HTML de um único produto
function createProductHtml(product) {
    const { id, name, price, discount, imageSrc, discountPercent, inStock } = product;
    
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const discountPrice = discount ? price * (1 - (discountPercent / 100)) : price;

    let cartButtonHtml = '';
    if (inStock) {
        cartButtonHtml = `<a href="#!" class="cart-btn" data-product-id="${id}"><i class="far fa-shopping-basket"></i> <span class="text">Adicionar ao carrinho</span></a>`;
    } else {
        cartButtonHtml = `<a href="#!" class="cart-btn disabled" aria-disabled="true" role="button"><i class="far fa-times"></i> <span class="text">Fora de Estoque</span></a>`;
    }

    let statusLabelHtml = '';
    if (!inStock) {
        statusLabelHtml = `<div class="discount">ESGOTADO</div>`;
    } else if (discount) {
        statusLabelHtml = `<div class="discount">${discountPercent}% Off</div>`;
    }

    const priceHtml = discount
        ? `<span class="price prev-price"><span class="currency">R$</span>${formatter.format(price)}</span>
           <span class="price new-price"><span class="currency">R$</span>${formatter.format(discountPrice)}</span>`
        : `<span class="price new-price"><span class="currency">R$</span>${formatter.format(price)}</span>`;

    const productClass = inStock ? '' : 'out-of-stock';

    return `
        <div class="col-xl-4 col-md-6 col-sm-12">
            <div class="product-item style-one mb-40 ${productClass}">
                <div class="product-thumbnail">
                    <img src="${imageSrc}">
                    ${statusLabelHtml}
                    <div class="hover-content">
                        <a href="shop-details.html?id=${id}" class="icon-btn"><i class="fa fa-eye"></i></a>
                    </div>
                    <div class="cart-button">
                        ${cartButtonHtml}
                    </div>
                </div>
                <div class="product-info-wrap">
                    <div class="product-info">
                        <h4 class="title"><a href="shop-details.html?id=${id}">${name}</a></h4>
                    </div>
                    <div class="product-price">
                        ${priceHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addToCart(product, products) {
    const productInCart = cart.find(item => item.product.id === product.id);
    if (productInCart) {
        productInCart.quantity++;
    } else {
        cart.push({ product: product, quantity: 1 });
    }
    renderCart(products);
}

function increaseQuantity(productId, products) {
    const item = cart.find(item => item.product.id === productId);
    if (item) {
        item.quantity++;
    }
    renderCart(products);
}

function decreaseQuantity(productId, products) {
    const item = cart.find(item => item.product.id === productId);
    if (item && item.quantity > 1) {
        item.quantity--;
    }
    renderCart(products);
}

// NOVA: Lógica de envio para o WhatsApp
function generateWhatsAppMessage() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        const product = item.product;
        const price = product.discount ? product.price * (1 - (product.discountPercent / 100)) : product.price;
        const itemPrice = price * item.quantity;
        totalItems += item.quantity;
        totalPrice += itemPrice;

        message += `${item.quantity}x ${product.name} - R$${formatter.format(itemPrice)}\n`;
    });

    message += `\nTotal do Pedido: R$${formatter.format(totalPrice)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

function renderCart(products) {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartCountDisplay = document.querySelector('.pro-count');
    const checkoutButton = document.getElementById('checkout-button');
    
    if (!cartItemsContainer || !cartTotalPrice || !cartCountDisplay || !checkoutButton) return;

    let cartHtml = '';
    let totalItems = 0;
    let totalPrice = 0;
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (cart.length === 0) {
        cartHtml = `<li class="sidebar-cart-item text-center">Nenhum produto adicionado ao carrinho.</li>`;
        checkoutButton.classList.add('disabled');
        checkoutButton.removeEventListener('click', generateWhatsAppMessage);
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
                    <a href="#">
                        <img src="${product.imageSrc}" alt="${product.name}">
                        ${product.name}
                    </a>
                    <div class="quantity-control" data-product-id="${product.id}">
                        <button class="quantity-btn quantity-down"><i class="fas fa-minus"></i></button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn quantity-up"><i class="fas fa-plus"></i></button>
                    </div>
                    <span class="item-total"><span class="currency">R$</span>${formatter.format(itemPrice)}</span>
                </li>
            `;
        });
        checkoutButton.classList.remove('disabled');
        checkoutButton.addEventListener('click', generateWhatsAppMessage);
    }

    cartItemsContainer.innerHTML = cartHtml;
    cartTotalPrice.innerHTML = `<span class="currency">R$</span>${formatter.format(totalPrice)}`;
    cartCountDisplay.textContent = totalItems.toString().padStart(2, '0');
    
    document.querySelectorAll('.remove-cart').forEach(removeBtn => {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = parseInt(e.currentTarget.dataset.productId);
            removeFromCart(productId, products);
        });
    });

    document.querySelectorAll('.quantity-control .quantity-down').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.parentNode.dataset.productId);
            decreaseQuantity(productId, products);
        });
    });

    document.querySelectorAll('.quantity-control .quantity-up').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.parentNode.dataset.productId);
            increaseQuantity(productId, products);
        });
    });
}

function removeFromCart(productId, products) {
    cart = cart.filter(item => item.product.id !== productId);
    renderCart(products);
}

// Função para renderizar a paginação
function renderPagination(products) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    let paginationHtml = '';
    
    paginationHtml += `<li class="${currentPage === 1 ? 'disabled' : ''}"><a href="#" class="pagination-btn" data-page="${currentPage - 1}"><i class="far fa-angle-left"></i></a></li>`;

    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<li class="${i === currentPage ? 'active' : ''}"><a href="#" class="pagination-btn" data-page="${i}">${i.toString().padStart(2, '0')}</a></li>`;
    }

    paginationHtml += `<li class="${currentPage === totalPages ? 'disabled' : ''}"><a href="#" class="pagination-btn" data-page="${currentPage + 1}"><i class="far fa-angle-right"></i></a></li>`;

    paginationContainer.innerHTML = paginationHtml;

    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const newPage = parseInt(e.currentTarget.dataset.page);
            if (newPage > 0 && newPage <= totalPages) {
                currentPage = newPage;
                renderProducts(products, true);
            }
        });
    });
}

// Função para renderizar todos os produtos
function renderProducts(products, shouldScroll) {
    products.sort((a, b) => {
        if (a.inStock === b.inStock) {
            return 0;
        }
        return a.inStock ? -1 : 1;
    });

    const productContainer = document.getElementById('product-container');
    const countDisplay = document.getElementById('product-count-display');

    if (productContainer) {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        const endIndex = startIndex + PRODUCTS_PER_PAGE;
        const productsToRender = products.slice(startIndex, endIndex);

        let allProductsHtml = '';
        productsToRender.forEach(product => {
            allProductsHtml += createProductHtml(product);
        });
        productContainer.innerHTML = allProductsHtml;
        
        if (countDisplay) {
            const totalProducts = products.length;
            const startProduct = startIndex + 1;
            const endProduct = Math.min(endIndex, totalProducts);
            countDisplay.innerHTML = `Mostrando ${startProduct}-${endProduct} de ${totalProducts} Resultados`;
        }

        renderPagination(products);
        initCartSidebar(products);
        
        if (shouldScroll) {
            const shopFilter = document.querySelector('.shop-filter');
            if (shopFilter) {
                shopFilter.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
}

// Função para inicializar o carrinho lateral (sem alteração)
function initCartSidebar(products) {
    const cartButtons = document.querySelectorAll('.cart-btn');
    const sideCart = document.querySelector('.sidemenu-wrapper-cart');
    const cartClose = document.querySelector('.sidemenu-cart-close');
    const overlay = document.querySelector('.offcanvas__overlay');
    const headerCartButton = document.querySelector('.header-navigation .cart-button a');

    if (headerCartButton) {
        headerCartButton.removeEventListener('click', openCart);
        headerCartButton.addEventListener('click', openCart);
    }

    if (cartButtons.length > 0) {
        cartButtons.forEach(btn => {
            btn.removeEventListener('click', openCartAndAddProduct);
            btn.addEventListener('click', openCartAndAddProduct);
        });
    }

    if (cartClose) {
        cartClose.removeEventListener('click', closeCart);
        cartClose.addEventListener('click', closeCart);
    }
    if (overlay) {
        overlay.removeEventListener('click', closeCart);
        overlay.addEventListener('click', closeCart);
    }
    
    function openCart(e) {
        e.preventDefault();
        if (sideCart) {
            sideCart.classList.add("info-open");
        }
        if (overlay) {
            overlay.classList.add("overlay-open");
        }
    }

    function openCartAndAddProduct(e) {
        if (e.currentTarget.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        const productId = parseInt(e.currentTarget.dataset.productId);
        const product = products.find(p => p.id === productId);
        if (product) {
            addToCart(product, products);
        }
        
        if (sideCart) {
            sideCart.classList.add("info-open");
        }
        if (overlay) {
            overlay.classList.add("overlay-open");
        }
    }
    
    function closeCart(e) {
        e.preventDefault();
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navMenu = document.querySelector('.pesco-nav-menu');
        
        if (sideCart) {
            sideCart.classList.remove("info-open");
        }
        if (overlay) {
            overlay.classList.remove("overlay-open");
        }
        if (navbarToggler) {
            navbarToggler.classList.remove("active");
        }
        if (navMenu) {
            navMenu.classList.remove("menu-on");
        }
    }
}

// Chamar a função principal quando a página for carregada
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});