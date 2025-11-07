document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];

    const createGridCardHtml = (product) => {
        const { id, name, price, discount, thumbnail, discountPercent, inStock } = product;
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const discountedPrice = discount ? price * (1 - discountPercent / 100) : price;
        let cartButtonHtml = inStock 
            ? `<a href="#!" class="cart-btn" data-product-id="${id}"><i class="far fa-shopping-basket"></i> <span class="text">Adicionar ao Carrinho</span></a>`
            : `<a href="#!" class="cart-btn disabled" aria-disabled="true" role="button"><i class="far fa-times"></i> <span class="text">Fora de Estoque</span></a>`;
        let statusLabelHtml = !inStock ? `<div class="discount">ESGOTADO</div>` : (discount ? `<div class="discount">${discountPercent}% Off</div>` : '');
        const priceHtml = discount
            ? `<span class="price prev-price">R$${formatter.format(price)}</span> <span class="price new-price">R$${formatter.format(discountedPrice)}</span>`
            : `<span class="price new-price">R$${formatter.format(price)}</span>`;
        return `
            <div class="col-xl-3 col-lg-4 col-sm-6">
                <div class="product-item style-one mb-40">
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
            </div>
        `;
    };

    const createSliderCardHtml = (product) => {
        const { id, name, price, discount, thumbnail, discountPercent, inStock } = product;
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const discountedPrice = discount ? price * (1 - discountPercent / 100) : price;
        let cartButtonHtml = inStock 
            ? `<a href="#!" class="cart-btn" data-product-id="${id}"><i class="far fa-shopping-basket"></i> <span class="text">Adicionar ao Carrinho</span></a>`
            : `<a href="#!" class="cart-btn disabled" aria-disabled="true" role="button"><i class="far fa-times"></i> <span class="text">Fora de Estoque</span></a>`;
        let statusLabelHtml = !inStock ? `<div class="discount">ESGOTADO</div>` : (discount ? `<div class="discount">${discountPercent}% Off</div>` : '');
        const priceHtml = discount
            ? `<span class="price prev-price">R$${formatter.format(price)}</span> <span class="price new-price">R$${formatter.format(discountedPrice)}</span>`
            : `<span class="price new-price">R$${formatter.format(price)}</span>`;
        return `
            <div class="product-item style-one mb-40">
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
        `;
    };

    const renderDiscountedProducts = () => {
        const container = document.querySelector('.feature-slider-one');
        if (!container) return;
        const discountedProducts = allProducts.filter(p => p.inStock && p.discount);
        container.innerHTML = discountedProducts.map(createSliderCardHtml).join('');
        if (jQuery(container).hasClass('slick-initialized')) {
            jQuery(container).slick('unslick');
        }
        jQuery(container).slick({
            dots: false, arrows: true, infinite: true, slidesToShow: 4, slidesToScroll: 1,
            prevArrow: '<button class="prev"><i class="far fa-angle-left"></i></button>',
            nextArrow: '<button class="next"><i class="far fa-angle-right"></i></button>',
            appendArrows: '.feature-arrows',
            responsive: [{ breakpoint: 1199, settings: { slidesToShow: 3 } }, { breakpoint: 991, settings: { slidesToShow: 2 } }, { breakpoint: 767, settings: { slidesToShow: 1 } }]
        });
    };
    
    // Função para renderizar os PRODUTOS PRINCIPAIS (com a nova lógica)
    const renderMainProducts = (filterType = 'bestseller') => {
        const container = document.querySelector('.main-products-grid');
        if (!container) return;
        let filteredProducts = [];
        const inStockProducts = allProducts.filter(p => p.inStock);

        if (filterType === 'bestseller') {
            filteredProducts = inStockProducts.filter(p => p.bestSeller === true).slice(0, 8);
        } else if (filterType === 'new') {
            filteredProducts = inStockProducts.slice(-8);
        } else if (filterType === 'sets') {
            filteredProducts = inStockProducts.filter(p => p.category === 'dermocare');
        }

        container.innerHTML = `<div class="row">${filteredProducts.map(createGridCardHtml).join('')}</div>`;
        
        initHomePageCartButtons();
    };
    
    const initHomePageCartButtons = () => {
        document.querySelectorAll('.cart-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.cart-btn').forEach(btn => {
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
    };

    async function initHomePage() {
        try {
            const response = await fetch('assets/js/products.json');
            allProducts = await response.json();
            
            renderDiscountedProducts();
            renderMainProducts('bestseller');
            initHomePageCartButtons();

            document.querySelectorAll('.pesco-tabs .nav-link').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.pesco-tabs .nav-link').forEach(t => t.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    const filter = e.currentTarget.dataset.filter;
                    renderMainProducts(filter);
                });
            });
        } catch (error) {
            console.error("Erro ao inicializar a página inicial:", error);
        }
    }

    if (document.querySelector('.features-products')) {
        initHomePage();
    }
});