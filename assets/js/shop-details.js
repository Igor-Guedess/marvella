document.addEventListener('DOMContentLoaded', () => {
    let allProducts = []; 

    async function initDetailsPage() {
        try {
            const response = await fetch('assets/js/products.json');
            allProducts = await response.json();

            const params = new URLSearchParams(window.location.search);
            const productId = parseInt(params.get('id'));

            if (!productId) {
                console.error('ID do produto não encontrado na URL.');
                return;
            }

            const currentProduct = allProducts.find(p => p.id === productId);

            if (currentProduct) {
                updateProductDetails(currentProduct);
            } else {
                console.error('Produto não encontrado com o ID:', productId);
            }

        } catch (error) {
            console.error('Erro ao carregar dados na página de detalhes:', error);
        }
    }

    const createRelatedProductHtml = (product) => {
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
            </div>`;
    };

    const renderRelatedProducts = (currentProduct) => {
        const relatedSlider = document.querySelector('.releted-product-slider');
        if (!relatedSlider) return;
        const relatedProducts = allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id && p.inStock);

        if (relatedProducts.length > 0) {
            relatedSlider.innerHTML = relatedProducts.map(createRelatedProductHtml).join('');
            if (jQuery(relatedSlider).hasClass('slick-initialized')) {
                jQuery(relatedSlider).slick('unslick');
            }
            jQuery(relatedSlider).slick({
                dots: false, arrows: true, infinite: true, slidesToShow: 4, slidesToScroll: 1,
                prevArrow: '<button class="prev"><i class="far fa-angle-left"></i></button>',
                nextArrow: '<button class="next"><i class="far fa-angle-right"></i></button>',
                appendArrows: '.releted-product-arrows',
                responsive: [{ breakpoint: 1199, settings: { slidesToShow: 3 } }, { breakpoint: 991, settings: { slidesToShow: 2 } }, { breakpoint: 767, settings: { slidesToShow: 1 } }]
            });
        } else {
            const section = document.querySelector('.releted-product-section');
            if (section) section.style.display = 'none';
        }
    };
    
    // Atualiza o preço na tela (incluindo badge de desconto)
    const updatePriceDisplay = (price, discountPercent) => {
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const prevPriceSpan = document.querySelector('.product-price .prev-price');
        const newPriceSpan = document.querySelector('.product-price .new-price');
        const saleBadge = document.querySelector('.product-info .sale');

        const hasDiscount = discountPercent > 0;
        const finalPrice = hasDiscount ? price * (1 - discountPercent / 100) : price;

        if (hasDiscount) {
            if(saleBadge) { 
                saleBadge.style.display = 'block'; 
                saleBadge.innerHTML = `<i class="fas fa-tags"></i>PROMO ${discountPercent}% OFF`; 
            }
            if(prevPriceSpan) { 
                prevPriceSpan.style.display = 'inline-block'; 
                prevPriceSpan.innerHTML = `R$${formatter.format(price)}`; 
            }
            if(newPriceSpan) { 
                newPriceSpan.innerHTML = `R$${formatter.format(finalPrice)}`; 
            }
        } else {
            if(saleBadge) saleBadge.style.display = 'none';
            if(prevPriceSpan) prevPriceSpan.style.display = 'none';
            if(newPriceSpan) newPriceSpan.innerHTML = `R$${formatter.format(price)}`;
        }
    };

    const initPageButtons = (currentProduct) => {
        if (currentProduct.inStock) {
            const mainBtn = document.querySelector('.product-cart-variation .theme-btn');
            if(mainBtn){
                const newBtn = mainBtn.cloneNode(true);
                mainBtn.parentNode.replaceChild(newBtn, mainBtn);
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();

                    const quantityInput = document.querySelector('.quantity-input .quantity');
                    const quantity = parseInt(quantityInput.value) || 1;

                    // Verifica variação selecionada
                    const activeTypeBtn = document.querySelector('.type-btn.active');
                    
                    let productToAdd = { ...currentProduct };

                    if (activeTypeBtn) {
                        const selectedType = activeTypeBtn.dataset.type;
                        const selectedPrice = parseFloat(activeTypeBtn.dataset.price);

                        productToAdd.name = `${productToAdd.name} - ${selectedType}`;
                        productToAdd.price = selectedPrice; 
                    }

                    if (typeof addToCart === 'function') {
                        addToCart(productToAdd, allProducts, quantity); 
                        document.querySelector('.sidemenu-wrapper-cart').classList.add("info-open");
                        document.querySelector('.offcanvas__overlay').classList.add("overlay-open");
                    } else {
                        console.error("Função addToCart não encontrada.");
                    }
                });
            }
        }
        
        document.querySelectorAll('.releted-product-slider .cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if(btn.classList.contains('disabled')) return;
                const productId = parseInt(btn.dataset.productId);
                const product = allProducts.find(p => p.id === productId);
                if(product && typeof addToCart === 'function'){
                    addToCart(product, allProducts);
                    document.querySelector('.sidemenu-wrapper-cart').classList.add("info-open");
                    document.querySelector('.offcanvas__overlay').classList.add("overlay-open");
                }
            });
        });
    };

    const updateProductDetails = (product) => {
        // --- INÍCIO DA LÓGICA DA GALERIA DE IMAGENS (CORRIGIDA) ---
        const bigSlider = document.querySelector('.product-big-slider');
        const thumbSlider = document.querySelector('.product-thumb-slider');
        
        if (product.images && product.images.length > 0 && bigSlider && thumbSlider) {
            try {
                // Remove sliders antigos
                if (jQuery(bigSlider).hasClass('slick-initialized')) { jQuery(bigSlider).slick('unslick'); }
                if (jQuery(thumbSlider).hasClass('slick-initialized')) { jQuery(thumbSlider).slick('unslick'); }
                // Remove listeners de eventos antigos
                jQuery(bigSlider).off('beforeChange');
                
                bigSlider.innerHTML = '';
                thumbSlider.innerHTML = '';
                
                product.images.forEach(imageUrl => {
                    bigSlider.innerHTML += `<div class="product-img"><img src="${imageUrl}" alt="${product.name}"></div>`;
                    thumbSlider.innerHTML += `<div class="product-img"><img src="${imageUrl}" alt="${product.name} thumbnail"></div>`;
                });
                
                let slidesCount = product.images.length;
                if (slidesCount > 4) slidesCount = 4;
                if (slidesCount < 1) slidesCount = 1;

                // Configurações dos Sliders
                let bigSliderConfig = { 
                    slidesToShow: 1, 
                    slidesToScroll: 1, 
                    arrows: false, 
                    fade: true,
                    asNavFor: '.product-thumb-slider' // Padrão: sincroniza
                };

                let thumbSliderConfig = { 
                    slidesToShow: slidesCount,
                    slidesToScroll: 1, 
                    asNavFor: '.product-big-slider', 
                    dots: false, 
                    arrows: false, 
                    focusOnSelect: true,
                    infinite: product.images.length > slidesCount 
                };

                // FIX: Se tiver poucas imagens, DESLIGA o controle do Big sobre o Thumb
                // Isso impede que as miniaturas se movam (rolem) quando se arrasta a imagem grande
                if (product.images.length <= 4) {
                    bigSliderConfig.asNavFor = null;
                }

                // Inicializa
                const $bigSlider = jQuery(bigSlider);
                const $thumbSlider = jQuery(thumbSlider);
                
                $bigSlider.slick(bigSliderConfig);
                $thumbSlider.slick(thumbSliderConfig);

                // FIX VISUAL: Se desligamos a sincronização acima, atualizamos a borda manualmente
                if (product.images.length <= 4) {
                    // Marca a primeira como ativa
                    $thumbSlider.find('.slick-slide').first().addClass('slick-current');

                    // Quando a imagem grande mudar, atualiza a borda da pequena sem mover o carrossel
                    $bigSlider.on('beforeChange', function(event, slick, currentSlide, nextSlide) {
                        $thumbSlider.find('.slick-slide').removeClass('slick-current slick-active');
                        $thumbSlider.find(`[data-slick-index="${nextSlide}"]`).addClass('slick-current slick-active');
                    });
                }

            } catch (error) { console.error("Erro slider:", error); }
        }
        // --- FIM DA LÓGICA DA GALERIA ---

        // Textos
        if(document.querySelector('.product-info .title')) document.querySelector('.product-info .title').textContent = product.name;
        if(document.querySelector('.product-info .short-description')) document.querySelector('.product-info .short-description').textContent = product.shortDescription;

        // Preço Inicial
        updatePriceDisplay(product.price, product.discount ? product.discountPercent : 0);

        // Variações (Botões de Tipo)
        const typesContainer = document.getElementById('product-types-container');
        const typesList = document.getElementById('type-buttons');
        
        if (typesContainer && typesList) {
            if (product.types && Array.isArray(product.types) && product.types.length > 0) {
                typesContainer.style.display = 'block';
                typesList.innerHTML = '';

                product.types.forEach((type, index) => {
                    const btn = document.createElement('button');
                    btn.classList.add('type-btn');
                    
                    let typeName, typePrice;
                    if (typeof type === 'object') {
                        typeName = type.name;
                        typePrice = type.price;
                    } else {
                        typeName = type;
                        typePrice = product.price; 
                    }

                    btn.textContent = typeName;
                    btn.dataset.type = typeName;
                    btn.dataset.price = typePrice; 

                    if (index === 0) {
                        btn.classList.add('active');
                        updatePriceDisplay(typePrice, product.discount ? product.discountPercent : 0);
                    }

                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        updatePriceDisplay(typePrice, product.discount ? product.discountPercent : 0);
                    });

                    typesList.appendChild(btn);
                });
            } else {
                typesContainer.style.display = 'none';
            }
        }

        // Estoque
        const addToCartButton = document.querySelector('.product-cart-variation .theme-btn');
        const quantityInputContainer = document.querySelector('.quantity-input');
        const saleBadge = document.querySelector('.product-info .sale');

        if (!product.inStock) {
            if(saleBadge) { saleBadge.style.display = 'block'; saleBadge.classList.add('out-of-stock'); saleBadge.innerHTML = `<i class="far fa-ban"></i> ESGOTADO`; }
            if (addToCartButton) { addToCartButton.classList.add('disabled'); addToCartButton.textContent = 'Fora de Estoque'; }
            if(quantityInputContainer) quantityInputContainer.style.display = 'none'; 
            document.querySelector('.product-price .prev-price').style.display = 'none';
        } else {
            if(saleBadge && saleBadge.classList.contains('out-of-stock')) saleBadge.style.display = 'none';
            if (addToCartButton) { addToCartButton.classList.remove('disabled'); addToCartButton.textContent = 'Adicionar ao Carrinho'; }
            if(quantityInputContainer) quantityInputContainer.style.display = ''; 
        }

        // Infos Detalhadas
        const infoContainer = document.querySelector('#informations');
        if (infoContainer && product.informations) {
            infoContainer.innerHTML = Array.isArray(product.informations) ? product.informations.join('\n') : product.informations;
        }

        const additionalInfoList = document.querySelector('.additional-info-box ul');
        if (additionalInfoList && product.additionalInfo) {
            additionalInfoList.innerHTML = '';
            for (const [key, value] of Object.entries(product.additionalInfo)) {
                additionalInfoList.innerHTML += `<li>${key}: <span>${value}</span></li>`;
            }
        }
        
        renderRelatedProducts(product);
        initPageButtons(product);
    };

    if (document.querySelector('.shop-details-wrapper')) {
        initDetailsPage();
    }
});