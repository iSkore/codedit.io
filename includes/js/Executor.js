class Executor
{
    constructor( js )
    {
        window.console.log   = function( ...args ) { Executor.output( 'console', args ); };
        window.console.info  = function( ...args ) { Executor.output( 'info', args ); };
        window.console.warn  = function( ...args ) { Executor.output( 'warning', args ); };
        window.console.error = function( ...args ) { Executor.output( 'danger', args ); };

        this.js = js;
        this.exec = generator.container( function * ( code ) {
            return yield new Promise( ( res, rej ) => {
                try {
                    code = code.replace( new RegExp( /(\/\/).*/, 'igm' ), '' );
                    res( (
                        ( () => {} ).constructor( `'use strict';{${code};}` )(), 0
                    ) );
                } catch( e ) { rej( e ); }
            } );
        } );
    }

    static output( type, data )
    {
        const
            isArray = Array.isArray,
            isObject = x => typeof x === 'object' && !isArray( x );

        function space( x ) {
            if( isArray( data ) ) {
                if( data.length ) {
                    x = Array.prototype.slice.call( x );
                    return x.reduce( ( r, item, i ) => {
                        if( isArray( item ) )
                            r += `[ ${space( item )} ]`;
                        else if( isObject( item ) )
                            r += item.constructor.name + ' ' + JSON.stringify( item, null, 4 );
                        else if( i !== x.length - 1 )
                            r += `${item}, `;
                        else
                            r += `${item}`;
                        return r;
                    }, '' );
                }
            } else if( typeof data === 'object' && !Array.isArray( data ) ) {
                return JSON.stringify( data, null, 4 );
                // return Object.keys( x ).reduce( ( r, item, i ) => {
                //     if( typeof x[ item ] === 'object' )
                //         r += `[ ${space( x[ item ] )} ]`;
                //     else if( i !== x[ item ].length - 1 )
                //         r += `${x[ item ]}, `;
                //     else
                //         r += `${x[ item ]}`;
                //     return r;
                // }, '' );
            }

            return x;
        }

        data = space( data );

        let result = $( '#output' );

        $( '<div>' )
            .addClass( `text-${type}` )
            .text( data )
            .appendTo( result );
    }

    end()
    {
        this.timeEnd = performance.now();
        console.timeEnd( 'exec' );
    }

    success( data )
    {
        this.end();

        if( Array.isArray( data ) )
            if( data[ 0 ] !== 0 )
                Executor.output( 'warning', data );

        this.stop();
    }

    error( data )
    {
        this.end();

        Executor.output( 'danger', data );

        this.stop();
    }

    start()
    {
        this.runTime = new Date();

        Executor.output( 'info', `JavaScript Execution started at: ${this.runTime}\n` );

        this.timeStart = performance.now();
        console.time( 'exec' );

        this.exec( this.js )
            .then(
                ( ...args ) => this.success( args ),
                e => this.error( e.stack )
            );
    }

    stop()
    {
        Executor.output(
            'info',
            `JavaScript Process completed in ${( this.timeEnd - this.timeStart ).toFixed( 3 )} ms`
        );
    }
}
