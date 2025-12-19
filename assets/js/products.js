document.addEventListener('DOMContentLoaded', () => {
    const CATEGORY_DISPLAY_NAMES = {
    "dermocare": "Dermocare",
    "puraessencia": "Pura Essência",
    "natureza": "Essência da Natureza",
    "oleos": "Óleos Puros",
    "lume": "Lume",
    "alento": "Alento",
    "duocare": "Duocare",
    "petcare": "Pet Care",
    "vela": "Velas Artesanais"
    };

    const VISIBLE_CATEGORIES = ['dermocare', 'puraessencia', 'oleos', 'vela'];

    // Variáveis de paginação
    const PRODUCTS_PER_PAGE = 12;
    let currentPage = 1;
    let allProducts = []; // Armazena todos os produtos

    async function initShopPage() {
        try {
            const response = await fetch('assets/js/products.json');
            allProducts = await response.json();
            
            renderCategories();
            renderProducts(allProducts, true);
        } catch (error) {
            console.error('Ocorreu um erro na página da loja:', error);
        }
    }

    function renderCategories() {
        const categoriesContainer = document.getElementById('category-list-container');
        if (!categoriesContainer) return;

        const categoryCounts = {};
        allProducts.forEach(product => {
            const category = product.category;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        let categoriesHtml = '';
        for (const category in categoryCounts) {
            if (!VISIBLE_CATEGORIES.includes(category)) continue;
            const count = categoryCounts[category];
            const categoryName = CATEGORY_DISPLAY_NAMES[category] || category;
            categoriesHtml += `
                <li>
                    <div class="form-check">
                        <input class="form-check-input category-filter-checkbox" type="checkbox" id="check-${category}" data-category="${category}">
                        <label class="form-check-label" for="check-${category}">${categoryName}<span>${count}</span></label>
                    </div>
                </li>`;
        }
        categoriesContainer.innerHTML = categoriesHtml;

        document.querySelectorAll('.category-filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                document.querySelectorAll('.category-filter-checkbox').forEach(other => {
                    if (other !== event.target) other.checked = false;
                });
                currentPage = 1;
                filterAndRenderProducts();
            });
        });
    }

    function filterAndRenderProducts() {
        const selectedCategories = Array.from(document.querySelectorAll('.category-filter-checkbox:checked')).map(cb => cb.dataset.category);
        
        let filteredProducts = allProducts;
        if (selectedCategories.length > 0) {
            filteredProducts = allProducts.filter(p => selectedCategories.includes(p.category));
        }
        renderProducts(filteredProducts, false);
    }

    function createProductHtml(product) {
        const { id, name, price, discount, thumbnail, discountPercent, inStock } = product;
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const discountPrice = discount ? price * (1 - (discountPercent / 100)) : price;

        let cartButtonHtml = inStock 
            ? `<a href="#!" class="cart-btn" data-product-id="${id}"><i class="far fa-shopping-basket"></i> <span class="text">Adicionar ao carrinho</span></a>`
            : `<a href="#!" class="cart-btn disabled" aria-disabled="true" role="button"><i class="far fa-times"></i> <span class="text">Fora de Estoque</span></a>`;

        let statusLabelHtml = !inStock ? `<div class="discount">ESGOTADO</div>` : (discount ? `<div class="discount">${discountPercent}% Off</div>` : '');
        const priceHtml = discount
            ? `<span class="price prev-price">R$${formatter.format(price)}</span> <span class="price new-price">R$${formatter.format(discountPrice)}</span>`
            : `<span class="price new-price">R$${formatter.format(price)}</span>`;

        return `
            <div class="col-xl-4 col-md-6 col-sm-12">
                <div class="product-item style-one mb-40 ${!inStock ? 'out-of-stock' : ''}">
                    <div class="product-thumbnail">
                        <img src="${thumbnail}" alt="${name}">
                        ${statusLabelHtml}
                        <div class="hover-content"><a href="shop-details.html?id=${id}" class="icon-btn"><i class="fa fa-eye"></i></a></div>
                        <div class="cart-button">${cartButtonHtml}</div>
                    </div>
                    <div class="product-info-wrap">
                        <div class="product-info"><h4 class="title"><a href="shop-details.html?id=${id}">${name}</a></h4></div>
                        <div class="product-price">${priceHtml}</div>
                    </div>
                </div>
            </div>`;
    }

    function renderPagination(products) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = `<li class="${currentPage === 1 ? 'disabled' : ''}"><a href="#" class="pagination-btn" data-page="${currentPage - 1}"><i class="far fa-angle-left"></i></a></li>`;
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

    function renderProducts(products, shouldScroll) {
        products.sort((a, b) => (a.inStock === b.inStock) ? 0 : (a.inStock ? -1 : 1));
        const productContainer = document.getElementById('product-container');
        const countDisplay = document.getElementById('product-count-display');

        if (productContainer) {
            const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
            const productsToRender = products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
            productContainer.innerHTML = productsToRender.map(createProductHtml).join('');
            
            if (countDisplay) {
                const endProduct = Math.min(startIndex + PRODUCTS_PER_PAGE, products.length);
                countDisplay.innerHTML = `Mostrando ${startIndex + 1}-${endProduct} de ${products.length} Resultados`;
            }

            renderPagination(products);
            
            // Ativa os botões de adicionar ao carrinho
            document.querySelectorAll('#product-container .cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if(btn.classList.contains('disabled')) return;
                    
                    const productId = parseInt(btn.dataset.productId);
                    const product = allProducts.find(p => p.id === productId);
                    if (product) {
                        addToCart(product, allProducts);
                        document.querySelector('.sidemenu-wrapper-cart').classList.add("info-open");
                        document.querySelector('.offcanvas__overlay').classList.add("overlay-open");
                    }
                });
            });
            
            if (shouldScroll) {
                const shopFilter = document.querySelector('.shop-filter');
                if (shopFilter) shopFilter.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // Verifica se estamos na página da loja para iniciar
    if (document.getElementById('product-container')) {
        initShopPage();
    }
});