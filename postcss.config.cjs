// Provide an explicit CommonJS export so PostCSS receives a concrete
// config path even when the project uses ESM ("type": "module").
// This avoids the "plugin did not pass the from option" warning that
// can trigger excessive rebuilds during development.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
