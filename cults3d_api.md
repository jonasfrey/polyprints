const CULTS_USERNAME = 'your_username';
const CULTS_API_KEY  = 'your_api_key';

const AUTH_HEADER = 'Basic ' + btoa(`${CULTS_USERNAME}:${CULTS_API_KEY}`);
const ENDPOINT    = 'https://cults3d.com/graphql';

async function createCults3DModel({
  name,
  description,
  imageUrls,   // string[] — public HTTPS URLs, max 10
  fileUrls,    // string[] — public HTTPS URLs, max 10
  categoryId,
  subCategoryIds = [],
  downloadPrice = 0,     // 0 = free
  currency = 'EUR',
  licenseCode = 'cc_by', // use 'cults_cu' for paid designs
  locale = 'EN',
}) {
  const mutation = `
    mutation CreateCreation(
      $name: String!
      $description: String!
      $imageUrls: [String!]!
      $fileUrls: [String!]!
      $categoryId: ID!
      $subCategoryIds: [ID!]
      $downloadPrice: Float!
      $currency: CurrencyEnum!
      $licenseCode: String
      $locale: LocaleEnum
    ) {
      createCreation(
        name: $name
        description: $description
        imageUrls: $imageUrls
        fileUrls: $fileUrls
        categoryId: $categoryId
        subCategoryIds: $subCategoryIds
        downloadPrice: $downloadPrice
        currency: $currency
        licenseCode: $licenseCode
        locale: $locale
      ) {
        creation {
          url(locale: EN)
          id
        }
        errors
      }
    }
  `;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AUTH_HEADER,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        name,
        description,
        imageUrls,
        fileUrls,
        categoryId,
        subCategoryIds,
        downloadPrice,
        currency,
        licenseCode,
        locale,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const { data, errors } = await response.json();

  if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
  if (data.createCreation.errors?.length) {
    throw new Error(data.createCreation.errors.join(', '));
  }

  return data.createCreation.creation; // { id, url }
}

// --- Usage ---

// Step 1: query categories to get the right categoryId
async function getCategories() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': AUTH_HEADER },
    body: JSON.stringify({ query: '{ categories { id name(locale: EN) children { id name(locale: EN) } } }' }),
  });
  const { data } = await res.json();
  return data.categories;
}

// Step 2: create the listing
const creation = await createCults3DModel({
  name: 'Gothic Gargoyle - Low Poly',
  description: 'A low-poly gargoyle designed for FDM printing. No supports needed.',
  imageUrls: ['https://your-cdn.com/gargoyle-render.jpg'],
  fileUrls:  ['https://your-cdn.com/gargoyle.3mf'],
  categoryId: 'Q2F0ZWdvcnkvMjM=',        // "Art" — use getCategories() to find the right one
  subCategoryIds: ['Q2F0ZWdvcnkvMzc'],   // optional subcategory
  downloadPrice: 2.50,
  currency: 'EUR',
  licenseCode: 'cults_cu',               // paid design license
});

console.log('Published at:', creation.url);