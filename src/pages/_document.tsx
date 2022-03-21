import React from 'react';
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import { resetIds } from '@fluentui/react/lib/Utilities';
import { Stylesheet } from '@fluentui/react/lib/Styling';

const stylesheet = Stylesheet.getInstance();

export interface CustomDocumentProps extends DocumentInitialProps {
  styleTags?: string;
  serializedStylesheet?: string;
}

export default class CustomDocument extends Document<CustomDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<CustomDocumentProps> {
    // https://github.com/microsoft/fluentui/wiki/Server-side-rendering-and-browserless-testing
    // https://nextjs.org/docs/advanced-features/custom-document

    if (ctx.err || (ctx.res?.statusCode && ctx.res.statusCode >= 400)) {
      // error page, don't render all the CSS
      return Document.getInitialProps(ctx);
    }

    resetIds();

    const originalRenderPage = ctx.renderPage;

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      // eslint-disable-next-line react/display-name
      originalRenderPage((App) => (props) => <App {...props} />);

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await Document.getInitialProps(ctx);

    return {
      ...initialProps,
      styleTags: stylesheet.getRules(true),
      serializedStylesheet: stylesheet.serialize(),
    };
  }

  render() {
    const { styleTags, serializedStylesheet } = this.props;
    return (
      <Html>
        <Head>
          {styleTags && <style type="text/css" dangerouslySetInnerHTML={{ __html: styleTags }} />}
          {/* This is one example on how to pass the data.
            The main purpose is to set the config before the Stylesheet gets initialised on the client.
            Use whatever method works best for your setup to achieve that. */}
          {serializedStylesheet && (
            <script
              type="text/javascript"
              dangerouslySetInnerHTML={{
                __html: `window.FabricConfig = { ...window.FabricConfig, serializedStylesheet: ${serializedStylesheet} };`,
              }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
