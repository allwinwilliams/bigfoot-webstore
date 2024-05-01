import {Suspense, useState} from 'react';

import {defer, redirect} from '@shopify/remix-oxygen';
import {Await, Link, useSearchParams, useLoaderData} from '@remix-run/react';

import TshirtCanvas from '../components/TshirtCanvas';
import AIShirtCanvas from '../components/AIShirtCanvas';
import P5Canvas from '../components/P5Canvas';

import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';

import { 
  Button,
  Box,
  useMediaQuery, useTheme
} 
from '@mui/material';

import {getVariantUrl} from '~/lib/variants';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Bigfoot | ${data?.product.title ?? ''}`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, request, context}) {
  
  const {handle} = params;
  const {storefront} = context;
  
  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: {handle},
  });

  return defer({product, variants});
}

/**
 * @param {{
 *   product: ProductFragment;
 *   request: Request;
 * }}
 */
function redirectToFirstVariant({product, request}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, variants} = useLoaderData();
  const {selectedVariant} = product;

  return (
    <div className="product">
      <ProductImage 
        image={selectedVariant?.image}
        variant={selectedVariant}
        product={product}
        handle={product.handle} />
      <ProductMain
        selectedVariant={selectedVariant}
        product={product}
        variants={variants}
      />
    </div>
  );
}


function ProductInspirations({ samples, selectedTshirt, onSelectTshirt }) {
  return (
    <Box style={{
        maxWidth: {sm: '100%'},  // Ensures it does not exceed the width of the viewport
        overflow: 'hidden',  // Prevents any internal component from affecting the outer layout
    }}>
      <Box style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          overflowX: 'auto',
          padding: 2,
          '&::-webkit-scrollbar': {
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '4px'
          }
      }}>
        {samples.map(sample => (
          <Box
              key={sample.id}
              style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 200,
                  minHeight: 300,
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  border: selectedTshirt && selectedTshirt.id === sample.id ? '2px solid #222' : '2px solid #bbb',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  flexShrink: 0,
                  padding: 1
              }}
              onClick={() => onSelectTshirt(sample)}
          >
            <Box style={{
                height: '100%',
                backgroundImage: `url(${sample.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '1rem'
            }} />
            {/* <img 
              src={`${sample.imageUrl}`}
            /> */}
            <Box style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Aligns the songName to top and songId to bottom
                alignItems: 'flex-start',
                padding: '8px',
                color: '#222',
            }}>
                <h5 style={{ margin: 0 }}>{sample.songName}</h5>
                <p style={{ margin: 0 }}>{sample.artist}</p>
                <p style={{ margin: 0 }}>{sample.songId}</p>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * @param {{image: ProductVariantFragment['image']}}
 */
function ProductImage({ product, image, variant, handle }) {
  console.log("AI TSHIRT LOADING");
  const [searchParams] = useSearchParams();
  const songId = searchParams.get('Song');

  console.log("SongID", songId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const secondaryCameraPositions = [
      { position: [5, 4, 5], fov: 50 },  
      { position: [8, 12, 6], fov: 10 },
      { position: [-5, 5, 5], fov: 50 },
      { position: [6, 6, 5], fov: 10 }
  ];

  const tshirtSamples = [
    { id: 1, color: 'red', songName: 'Wish you were here', artist: 'Pink Floyd', songId: 'kdfsjb3weurb', imageUrl: '/images/sampleimage.png', position: [5, 4, 5], fov: 50 },
    { id: 2, color: 'blue', songName: 'Wish you were here', artist: 'Pink Floyd', songId: 'kdfsrhfweisfdub', imageUrl: '/images//sampleimage.png', position: [8, 12, 6], fov: 10 },
    { id: 3, color: 'green', songName: 'Wish you were here', artist: 'Pink Floyd', songId: 'weurhfweisfdub', imageUrl: '/images//sampleimage.png', position: [-5, 5, 5], fov: 50 },
    { id: 4, color: 'yellow', songName: 'Wish you were here', artist: 'Pink Floyd', songId: 'rhfweisfdub', imageUrl: '/images//sampleimage.png', position: [-5, 5, 5], fov: 50 },
    { id: 5, color: 'purple', songName: 'Wish you were here', artist: 'Pink Floyd', songId: 'eurhfweisfdub', imageUrl: '/images//sampleimage.png', position: [-5, 5, 5], fov: 50 },
  ];

const [selectedTshirt, setSelectedTshirt] = useState(tshirtSamples[0]);

const theme = useTheme();

const handlePrevClick = () => {
    if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
    } else {
        setCurrentIndex(secondaryCameraPositions.length - 1);
    }
};

  const handleNextClick = () => {
      if (currentIndex < secondaryCameraPositions.length - 1) {
          setCurrentIndex(currentIndex + 1);
      } else {
          setCurrentIndex(0);
      }
  };

  if (handle === 'data-art-oversized-tshirt') {
      return (
          <Box
            style={{
              maxWidth: {sm: '100vw', md: '50vw'},
              width: {sm: '100vw'},
              margin: '0',
              padding: '0',
              overflowX: 'hidden',
            }}
          >
              {/* <P5Canvas song={songId} /> */}
              <Box className="threejs-canvas" style={{ position: 'relative' }}>
                  <TshirtCanvas 
                      key={JSON.stringify(secondaryCameraPositions[currentIndex])}
                      color={variant.selectedOptions[0].value}
                      songId={songId}
                      camerapos={secondaryCameraPositions[currentIndex].position}
                      fov={secondaryCameraPositions[currentIndex].fov}
                      width="100%"
                      height={ useMediaQuery(theme.breakpoints.down('sm')) ? "50vh": "90vh"}
                      controls={false}
                  />
                  <CustomiseButton
                   product={product}
                   customStyle={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    padding: '1rem',
                    cursor: "nesw-resize"
                    }}
                    variant="outlined"
                    color="primary"
                    />
                  <Box style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '100%'
                  }}>
                      <Button onClick={handlePrevClick}><ArrowBackIosIcon /></Button>
                      <Button onClick={handleNextClick}><ArrowForwardIosIcon /></Button>
                  </Box>
              </Box>
              {/* <ProductInspirations samples={tshirtSamples} selectedTshirt={selectedTshirt} onSelectTshirt={setSelectedTshirt} /> */}
          </Box>
      );
  }

  if (handle === 'short-sleeve-ai-generated-unisex-shirt') {
    return (
      <div className="threejs-canvas">
        <AIShirtCanvas 
          prompt="Dancing cat"
        />
      </div>
    );
  }

  if (!image) {
    return <div className="product-image" />;
  }
  
  return (
    <div className="product-image">
      <Image
        alt={image.altText || 'Product Image'}
        aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Promise<ProductVariantsQuery>;
 * }}
 */

function ProductMain({selectedVariant, product, variants}) {
  const {title, descriptionHtml} = product;
  return (
    <Box
      className="product-main"
      style={{margin: '0 1rem'}}
    >
      <h1
        style={{
          marginBottom:'0.5rem',
          marginTop: '1rem',
        }}
      >{title}</h1>
      <ProductPrice selectedVariant={selectedVariant} />
      <br />
      <Suspense
        fallback={
          <ProductForm
            product={product}
            selectedVariant={selectedVariant}
            variants={[]}
          />
        }
      >
        <Await
          errorElement="There was a problem loading product variants"
          resolve={variants}
        >
          {(data) => (
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={data.product?.variants.nodes || []}
            />
          )}
        </Await>
      </Suspense>
      <br />
      <br />
      <p>
        <strong>Description</strong>
      </p>
      <br />
      <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
      <br />
    </Box>
  );
}

/**
 * @param {{
 *   selectedVariant: ProductFragment['selectedVariant'];
 * }}
 */
function ProductPrice({selectedVariant}) {
  return (
    <div className="product-price">
      {selectedVariant?.compareAtPrice ? (
        <>
          <br />
          <div className="product-price-on-sale">
            {selectedVariant ? <Money className="offer-price-amount" data={selectedVariant.price} /> : null}
            <s>
              <Money data={selectedVariant.compareAtPrice} />
            </s>
          </div>
          <p>LIMITED TIME OFFER</p>
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Array<ProductVariantFragment>;
 * }}
 */
function ProductForm({product, selectedVariant, variants}) {
  // console.log("product", product)
  // console.log("variants", variants)
  // console.log("selected variant", selectedVariant)
  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({option}) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      
      <br />
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          window.location.href = window.location.href + '#cart-aside';
        }}
        customStyle={{
          position: {
            xs: 'fixed', 
            sm: 'fixed', 
            md: 'relative'
          },
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 1100,
          padding: '1.5rem',
          borderRadius: 0,  
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Buy Now @' : 'Sold out'}
        <Money className="offer-price-amount" data={selectedVariant.price} />
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({option}) {
  if(option.name == "Size"){
    return (
      <div className="product-options" key={option.name}>
        <h5>Select {option.name}</h5>
        <div className="product-options-grid">
          {option.values.map(({value, isAvailable, isActive, to}) => {
            return (
              <Link
                className="product-options-item"
                key={option.name + value}
                prefetch="intent"
                preventScrollReset
                replace
                to={to}
                style={{
                  border: isActive ? '2px solid black' : '2px solid #aaaaaa',
                  opacity: isAvailable ? 1 : 0.3,
                }}
              >
                {value}
              </Link>
            );
          })}
        </div>
        <br />
      </div>
    );
  }
 
}


/**
 * @param {{
*   analytics?: unknown;
*   children: React.ReactNode;
*   disabled?: boolean;
*   lines: CartLineInput[];
*   onClick?: () => void;
* }}
*/


function AddToCartButton({analytics, children, disabled, lines, onClick, customStyle}) {
  return (
    <div>
      <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <Button
            type="submit"
            variant="contained"
            color='primary'
            onClick={onClick}
            className="add-to-cart"
            disabled={disabled ?? fetcher.state !== 'idle'}
            sx={{
              ...customStyle,
            }}
          >
            {children}
          </Button>
        </>
      )}
    </CartForm>
    </div>
    
  );
}

/**
 * @param {{product: product}}
 */
function CustomiseButton({product, variant = 'contained', color = 'Primary', customStyle}){
  // const navigate = useNavigate(); // Hydrogen's navigate hook
  let customise_link = `/products/${product.handle}/customise`;
  const handleClick = () => {
      console.log('Button clicked to customise'); 
      window.location.href = customise_link;
      // navigate('/customise'); // Navigate to the /customise route
  };

  console.log("link to", customise_link);
  return(
    <div>
      <Button
        className="customise-button"
        variant={variant}
        color={color}
        type="submit"
        href={customise_link}
        onClick={handleClick}
        style={{
          ...customStyle,
        }}
      >
            Edit
      </Button>

    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantsQuery} ProductVariantsQuery */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
/** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineInput} CartLineInput */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
