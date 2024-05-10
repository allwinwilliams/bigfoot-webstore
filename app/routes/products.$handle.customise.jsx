import {Suspense, useState, useEffect, createContext, useContext} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {Await, Link, useLoaderData} from '@remix-run/react';
import TshirtCanvas, {SongCylinderCanvas} from '../components/TshirtCanvas';
import AIShirtCanvas from '../components/AIShirtCanvas';

import ArrowBackwardIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos';
import EditIcon from '@mui/icons-material/Edit';
import {uploadDataWithImage, sendDataToFirestore, uploadCanvasImage} from '../lib/firebaseUtils';

import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

import { 
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CardActionArea
} 
from '@mui/material';


import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';

import {getVariantUrl} from '~/lib/variants';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Bigfoot | ${data?.product.title ?? ''}`}];
};

const CustomiseAppContext = createContext(null);

export function useCustomiseAppContext() {
  return useContext(CustomiseAppContext);
}

export const CustomiseProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState('');
  const [color, setColor] = useState('Black');
  const [songId, setSongId] = useState('');
  const [selectionState, setSelectionState] = useState("Song");
  const {customer} = useLoaderData();
  const customerID = customer ? customer.id ? `${customer.id}` : "No customer ID" : "No customer";
  console.log("customer", customer);

  useEffect(() => {
    const CLIENT_ID = "b2cc0a3604154457ac2d7c216d8e55a1";
    const CLIENT_SECRET = "38e579a2942f4930af3c4eed0737696a";
    if (!accessToken) {
      const authParameters = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
      };

      fetch('https://accounts.spotify.com/api/token', authParameters)
        .then(result => result.json())
        .then(data => setAccessToken(data.access_token));
    }
  }, [accessToken]);

  const changeColor = (newColor) => setColor(newColor);
  const changeSongId = (newSongId) => setSongId(newSongId);
  const changeSelectionState = (newState) => setSelectionState(newState);

  return (
    <CustomiseAppContext.Provider value={{
      accessToken,
      color,
      songId,
      selectionState,
      customerID,
      changeColor,
      changeSongId,
      changeSelectionState,
    }}>
      {children}
    </CustomiseAppContext.Provider>
  );
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, request, context}) {
  const {handle} = params;
  const {storefront} = context;

  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

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

  return defer({
    product,
    variants,
    customer: data.customer
  });
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
    <CustomiseProvider>
      <div className="product">
        <ProductImage 
          image={selectedVariant?.image}
          variant={selectedVariant}
          handle={product.handle} 
        />
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
        />
        {/* <SongCylinderCanvas /> */}
      </div>
    </CustomiseProvider>
  );
}

/**
 * @param {{image: ProductVariantFragment['image']}}
 */
function ProductImage({image, variant, handle}) {
  const { accessToken, color, songId } = useCustomiseAppContext();

  if (handle === 'data-art-oversized-tshirt') {
    return (
      <div className="threejs-canvas">
        <TshirtCanvas 
          camerapos={[0, 10, 3]}
          fov={50}
          height={'70vh'}
          color={color}
          songId={songId}
          accessToken={accessToken}
          controls={true}
        />
      </div>
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
    <div className="product-main">
      {/* <h4>Customise: {title}</h4> */}
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
  
  const { color, songId, customerID, selectionState, changeSelectionState } = useCustomiseAppContext(); 
  console.log("Product options", product);
  
  return (
    <div
      className="product-form"
      style={{
        position: 'fixed', // Keep it fixed relative to the screen
        left: 0,           // Align to the left edge of the viewport
        right: 0,          // Align to the right edge of the viewport
        bottom: 0,         // Position it at the bottom of the viewport
        width: '100%',     // Take the full width of the viewport
        zIndex: 1000,      // Ensure it stays on top of other content
        backgroundColor: 'white', // Optional, ensures content stands out
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.2)', // Optional, adds shadow for better separation
        padding: '24px'
      }}
      >
      <div style={{
        display: 'flex',      
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        width: '100%',
      }}>
        <IconButton
          aria-label="left"
          style={{ borderRadius: '50%' }}
          onClick={() => { changeSelectionState("Song") }}
        >
          <ArrowBackwardIcon />
        </IconButton>

        <div>
          {(() => {
            if (selectionState === "Song") {
              return (
              <b>Select a song</b>
              );
            }
            if (selectionState === "Color") {
              return (
                <b>Choose a color</b>
              );
            }
          })()}
        </div>

        <IconButton
          aria-label="right"
          style={{ borderRadius: '50%' }}
          onClick={() => { changeSelectionState("Color") }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </div>
      

      {(() => {
        if(selectionState == "Song"){
          return(
            <ProductSongSelector
              key="Song"
              value=""
              to={`/products/${product.handle}`}
            />
          )
        }
        if(selectionState == "Color"){
          return(
            <VariantSelector
              handle={product.handle}
              options={product.options}
              variants={variants}
            >
              {({option}) => 
                {
                  return(
                    <ProductOptions
                      key={option.name}
                      option={option}
                    />
                  )
                }
              }
            </VariantSelector>
          )
        }
      })()}

      <br />
      <Button
        variant="contained"
        color="primary"
        type="submit"
        fullWidth
        onClick={() => {
          let designCanvas = document.getElementById('plain-canvas');
          uploadDataWithImage(
            designCanvas, 
            'orders', 
            {
              color: color, trackId: songId, customer: customerID
            }
            ).then(result => console.log('Data and image uploaded successfully:', result))
            .catch(error => console.error('Error uploading data and image:', error));
          }}

          // sendDataToFirestore(
          //   "orders", {
          //  color: color, trackId: songId 
          //</div>}
          //   );
          // uploadCanvasImage(designCanvas);

          
      >
        Save Your Design
      </Button>
    </div>
  );
}


function ProductSongSelector({ value }) {

  const { songId, changeSongId } = useCustomiseAppContext();
  
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // setInputValue(value);
  };

  const handleSubmit = (value) => {
    console.log("Submit:", value);
    changeSongId(value); 
    handleClose();
  };

  return (
    <div className="product-options">
      <div className="product-options-grid">
        <Button
          variant="outlined"
          onClick={handleOpen}
          fullWidth
          endIcon={<EditIcon />}
          size="large"
          style={{
            height: '60px'
          }}
        >
          {songId === "" ? "Select a song" : songId}
        </Button>

        <SongSelectionDialog
          fullScreen={fullScreen}
          open={open}
          handleClose={handleClose}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
        />
        
      </div>
    </div>
  );
}

function truncateString(str, num) {
  if (str.length > num) {
      return str.slice(0, num) + '...';
  } else {
      return str;
  }
}

function SongSelectionDialog({ fullScreen, open, handleClose, handleSubmit }) {

  const { accessToken } = useCustomiseAppContext();

  const [inputValue, setInputValue] = useState('');
  const [tracks, setTracks] = useState([]);
  
  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      
      const searchValue = event.target.value;
      
      console.log("Searching...", searchValue);
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      };
      
      fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchValue)}&type=track&limit=5`, requestOptions)
        .then(response => response.json())
        .then(data => {
          if (data.tracks && data.tracks.items) {
            console.log("Search result", data.tracks.items);
            setTracks(data.tracks.items);
          }
        })
        .catch(error => console.log('Error fetching tracks:', error));
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Select a Song</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          id="song-search"
          label="Search Song"
          type="text"
          variant="outlined"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleSearch}
          required
          sx={{ mt: 2 }}
        />
        <>
          {tracks.map(track => (
            
            <Card 
              key={track.id}
              sx={{marginBottom: 2,}}
            >
              <CardActionArea
                onClick={() => handleSubmit(track.id)}
                sx={{ display: 'flex', width: '100%', padding: '0px 1rem' }}
              >
                <div
                  style={{padding: 1}}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 80, height: 80, borderRadius: '8px' }}
                    image={track.album.images[1].url} 
                    alt={`Cover for ${track.name}`}
                  />
                </div>
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <CardContent sx={{ flex: '1 0 auto', padding: 0, marginLeft: '8px' }}>
                    <Typography variant="h6" component="div">
                    {truncateString(track.name, 24)}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div">
                      {track.artists.map(artist => artist.name).join(', ')} 
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {track.album.name}
                    </Typography>
                  </CardContent>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', mx: 3, mb: 2 }}>
        <Button
          onClick={handleClose}
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSubmit(inputValue)}
          color="primary"
          variant="contained"
          fullWidth
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}


/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({option, state, onStateChange}) {
  console.log("Option", option);
  const {selectionState, changeColor } = useCustomiseAppContext();
  if(option.name == "Color" && selectionState == "Color"){
    return (
      <div className="product-options" key={option.name}>
        {/* <h5>{option.name}</h5> */}
        <Box
          className="product-options-grid"
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center'
          }}
        >
          {option.values.map(({value, isAvailable, isActive, to}) => {
              return (
                <Link
                  className="product-options-item"
                  key={option.name + value}
                  prefetch="intent"
                  preventScrollReset
                  replace
                  // to={`${to}/customise`}
                  onClick={() => {
                    console.log("this color ->", option)
                    changeColor(value);
                    console.log("this link ->", `${to}/customise`)
                  }
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: '0.5 0 auto',
                    border: isActive ? '2px solid black' : '2px solid #aaa',
                    opacity: isAvailable ? 1 : 0.3,
                    textDecoration: 'none',
                    color: 'inherit',
                    margin: '4px',
                    padding: '12px',
                  }}
                >
                  <div
                    className="product-color-option-circle"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: `${value}`,
                      marginRight: '8px',
                    }}
                  />
                  <b>{value}</b>
                </Link>
              );
          })}
        </Box>
      </div>
    );
  }

  if(option.name == "Size" && selectionState == "Size"){
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
                  border: isActive ? '1px solid black' : '1px solid transparent',
                  opacity: isAvailable ? 1 : 0.3,
                }}
              >
                {value}
              </Link>
            );
          })}
        </div>
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
function AddToCartButton({analytics, children, disabled, lines, onClick}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            class="add-to-cart"
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
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
