import build from './app';

require('dotenv').config();

const PORT: number = +(process.env.PORT || 3000);

(async () => {
    const server = await build();

    server.listen({ port: PORT }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
})();
