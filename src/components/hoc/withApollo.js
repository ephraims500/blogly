import React from 'react';
import types from 'prop-types';
import Head from 'next/head';
import { getDataFromTree } from 'react-apollo';
import initApollo from '../../lib/init-apollo';

export default (App) => {
    return class Apollo extends React.Component {
        static displayName = 'withApollo(App)';
        static async getInitialProps(ctx) {
            const { Component, router } = ctx;

            let appProps = {};
            if (App.getInitialProps) {
                appProps = await App.getInitialProps(ctx);
            }

            const apolloState = {};

            // Run all GraphQL queries in the component tree
            // and extract the resulting data
            const apollo = initApollo();
            if (!process.browser) {
                try {
                    // Run all GraphQL queries
                    await getDataFromTree(
                        <App
                            {...appProps}
                            Component={Component}
                            router={router}
                            apolloState={apolloState}
                            apolloClient={apollo}
                        />
                    );
                } catch (error) {
                    // Prevent Apollo Client GraphQL errors from crashing SSR.
                    // Handle them in components via the data.error prop:
                    // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
                    console.error('Error while running `getDataFromTree`', error); // eslint-disable-line
                }

                // getDataFromTree does not call componentWillUnmount
                // head side effect therefore need to be cleared manually
                Head.rewind();

                // Extract query data from the Apollo store
                apolloState.data = apollo.cache.extract();
            } else {
                apolloState.data = {};
            }

            return {
                ...appProps,
                apolloState
            };
        }
        static propTypes = {
            apolloState: types.object
        };

        constructor(props) {
            super(props);
            this.apolloClient = initApollo(props.apolloState.data);
        }

        render() {
            return <App {...this.props} apolloClient={this.apolloClient} />;
        }
    };
};