# Archived ⚠️

This repository is deprecated. Please refer to the [main repository for the new backoffice](https://github.com/umbraco/Umbraco.CMS.Backoffice) for further work.

----


# Proof of Concept: The New Backoffice

## What is this repository about?

The POC is made to showcase some of the concepts that will be the foundation of the new Backoffice. It is released as part of the final RFC: Implement new Backoffice in the New Backoffice RFC series.

Please read the RFC before diving into the POC.

In the POC you will find concepts for:

- API Schemas
- Server Communication
- Routing
- Context API
- Extension API

## Installation instructions :rocket:

1. Run `npm install`
2. Run `npm run dev` to launch Vite in dev mode

## Login

Log in with any email and password.

## API Schemas

The server communication is built with a schema-first approach. This means that we generate all types based on an OpenAPI 3.0 schema, which is located in [./schemas/api/api.yml](./schemas/api/api.yml) for now. Eventually this schema will be built globally for the CMS and located in its own repository enabling both the backend and frontend to adhere to it.

If anything changes in the schema, the types can be regenerated like this:

1. Run `npm run generate-api`
2. The script looks at the schema [./schemas/api/api.yml](./schemas/api/api.yml) and generates the types
3. Now [./schemas/generated-schema.ts](./schemas/generated-schema.ts) should be generated

The types in the POC are converted into TypeScript types and exported in [./src/core/models/index.ts](./src/core/models/index.ts). This allows for type references that looks like `UserResponse` instead of `components['schemas']['UserResponse']`, and if the schema should ever change, we do not need to update the naming everywhere.

### Operations

All API operations are marked in the generated types as an interface called `operations` and is used in the `paths` interface to ensure that you can only call paths that exist.

#### How to use it

Using another package called `openapi-typescript-fetch` we can set up a fetcher for these operations and generate strongly typed “fetchers” for all operations:

```ts
import { paths } from './schema';
import { Fetcher } from 'openapi-typescript-fetch';

// First we generate a HTTP fetcher (using Fetch) from the generated schema
const fetcher = Fetcher.for<paths>();

// We assign one of the paths (content-by-id) to a constant which makes it type-strong
const getContentById = fetcher.path('/content/{id}').method('get').create();

// Try and get the data (error codes are not thrown as exceptions but will have to be read from the response
try {
  const { data } = await getContentById({ id: 1 });

  // If the data is truthy we know we got the content
  if (data) {
    console.log('node', data);

    // If the data is not truthy then the data did not exist
  } else {
    console.log('node does not exist');
  }

  // If we land in the catcher, something went wrong with the connection or perhaps the endpoint did not exist
} catch (e) {
  console.log('error', e);
}
```

When you call the `getContentById` operation, it uses Fetch in the background to make the XHR call to the server and the data-type and status codes are now strongly typed.

Read more on [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) to see for instance how to run operations in parallel or how to infer error responses.

### Examples

This POC comes with an almost complete Umbraco installer that showcases how the operations work.

Go to [./src/core/api/fetcher.ts](./src/core/api/fetcher.ts) to see all the exported typed fetch operations, and then check out [./src/installer/installer-context.ts](./src/installer/installer-context.ts), which is the context service for the installer and uses the operations in a couple of public methods. The context service is provided from [./src/installer/installer.element.ts](./src/installer/installer.element.ts) downstream for all installer components to consume.

You can see the installer in action by changing the `VITE_UMBRACO_INSTALL_STATUS` variable in [./.env](./.env) to `false` which tells the “init” operation that the underlying Umbraco backend is in an uninstalled state.

## Server communication

To perform requests, we use `Fetcher` from openapi-typescript-fetch.

### Development mode: Mocked responses

If you check out the network console in the browser while running the app, you can see that all fetch requests are returned with actual data. This is happening because we are utilizing another package called [Mock Service Worker (msw)](https://mswjs.io/), which allows us to respond to individual requests with a set of mocked data. You can see (and adjust) the data for each endpoint in the file [./src/mocks/handlers.ts](./src/mocks/handlers.ts).

### Production mode: Real requests

In production mode `msw` will not intercept the fetcher. The requests will instead hit a backend service that can respond with live data, albeit this mode has not been implemented in the POC.

## Routing

We want to make routing more flexible than the current backoffice, and we want to allow each part of the UI to add the routes it needs. It could for example be a Content App that allows deep links into tabs.

In the POC we use the [router-slot](https://www.npmjs.com/package/router-slot) package that provides the flexibility we are looking for. The router allows any part of the UI to add its own router outlet through a `<router-slot>` element:

```js
const routerSlot = document.querySelector('router-slot');
await routerSlot.add([
  {
    path: 'login',
    component: () => import('./path/to/login/component'),
  },
]);

<router-slot></router-slot>;
```

You can find examples of routing in different parts of the POC. In [./src/app.ts](./src/app.ts), we set up the root routing between the login, installer, and backoffice elements. In [./src/backoffice/backoffice.element.ts](./src/backoffice/backoffice.element.ts), we dynamically generate routes based on the registered sections.

## Context API

The POC comes with a context API ([./src/core/context/index.ts](./src/core/context/index.ts)) to provide APIs and data contexts to different parts of the application. Our context API is inspired by the [Provider Pattern](https://www.patterns.dev/posts/provider-pattern/) known from both [React](https://reactjs.org/docs/context.html) and [Vue](https://vuejs.org/guide/components/provide-inject.html).

The Context API is framework agnostic and uses DOM events for requesting and providing contexts. Data shared within a context should offer a pub/sub model to support reactivity across frameworks. A context can be provided at any given time in the application that makes the API async. A context can be consumed from anywhere within the same DOM tree and will be notified when the API is ready to be used or changed. You can find more details about the Context API in [RFC: Define the Backoffice Extension API](https://github.com/umbraco/rfcs/blob/0023-define-the-backoffice-extension-api/cms/0023-define-the-backoffice-extension-api.md#context-and-dependency-injection)

In [./src/backoffice/backoffice.element.ts](./src/backoffice/backoffice.element.ts), we provide three contexts that will only be available when the Backoffice element is rendered (after the user logs in).

```js
class UmbBackoffice extends UmbContextProviderMixin(LitElement) {
  constructor() {
    super();

    this.provideContext('umbNotificationService', new UmbNotificationService());
  }
}
```

This notification service can be used anywhere within the Backoffice as an example in a Property Editor. See the full example in [./src/backoffice/property-editors/property-editor-context-example.element.ts](./src/backoffice/property-editors/property-editor-context-example.element.ts).

```js
class UmbPropertyEditorContextExample extends UmbContextConsumerMixin(LitElement) {
  constructor() {
    super();

    this.consumeContext('umbNotificationService', (service: UmbNotificationService) => {
      this._notificationService = service;
    });
  }
}
```

## Extension API

The POC is built as an empty frame, and most parts of the UI have to be registered in the Extension Registry to show up. UI registrations happen at runtime and can be done at any time. That means that all the core Backoffice UI elements, and any third-party packages/extension, live next to each other and have the same capabilities.

The Extension Registry is provided through the Context API and can be consumed from anywhere in the app.

The POC ([./src/app.ts](./src/app.ts)) shows how we fetch extension manifest files from the server and register them in the Extension Registry. It will also be possible to register extensions runtime through javascript files.

In [./src/mocks/domains/manifests.handlers.ts](./src/mocks/domains/manifests.handlers.ts) we mock the server request for manifest files. The source files for the elements are written as vanilla JS Web Components (as an example) and can be found in the fake [./public/App_Plugins](./public/App_Plugins/section.js) folder. This folder and its’ handler imitates how extensions/packages will be loaded in a real-world application where the server contains the `App_Plugins` folder.

To get an overview of all registered UI Elements, we have made a table in the "Settings"-section, which you can see by running the app and clicking “Settings” in the top bar.

## Testing

As part of the backoffice frontend we will have unit- and integration tests for all APIs and elements. We use [Web Test Runner](https://modern-web.dev/docs/test-runner/overview) with the [Playwright Browser launcher](https://modern-web.dev/docs/test-runner/browser-launchers/playwright/). This allows us to run tests in real browsers in both Chromium, Firefox and Webkit.

We use the [Mocha](https://mochajs.org/) framework to write the tests.

Run the tests with: `npm test`

This POC includes tests for the Context API. You can find a test for the ContextConsumer Class [./src/core/context/context-consumer.test.ts](http://./src/core/context/context-consumer.test.ts).

## How to contribute

This repository will be archived when the RFC is accepted, and there will then be a link to another repository where the real implementation will take place.

We will **not** be accepting issues, pull requests, or discussions on this repository.

We are happy to continue the discussion with you on the discussions board for the RFC:

[Ask a question or bring a suggestion here on our discussion board](https://github.com/umbraco/rfcs/discussions/34)
