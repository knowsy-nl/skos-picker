# `<skos-picker>` in Vue 3

Vue renders custom elements natively. No wrapper component is needed.

## 1. Tell Vue it's a custom element

So Vue treats `<skos-picker>` as a real element (and doesn't warn or try to
resolve it as a Vue component), mark it in the compiler options.

With Vite (`vite.config.js`):

```js
import vue from '@vitejs/plugin-vue';

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'skos-picker',
        },
      },
    }),
  ],
};
```

## 2. Register the element and use it

```vue
<script setup>
import '@knowsy/skos-picker/web-component';
import { ref } from 'vue';

const cuisine = ref('Italian');
</script>

<template>
  <!-- v-model works because Vue maps it to the `value` prop + `change` event,
       and the element exposes both. -->
  <skos-picker
    scheme-id="Cuisine"
    data-source="/api/vocab/Cuisine"
    placeholder="Pick a cuisine…"
    v-model="cuisine"
  />
  <p>Selected: {{ cuisine }}</p>
</template>
```

> If your `v-model` doesn't update, bind explicitly — the element's event
> payload is on `detail.value`:
>
> ```vue
> <skos-picker scheme-id="Cuisine" :value="cuisine" @change="cuisine = $event.detail.value" />
> ```

## 3. Multi-select

```vue
<script setup>
const genres = ref([]); // string[]
</script>

<template>
  <skos-picker
    scheme-id="Music-Genre"
    multiple
    :value="genres"
    @change="genres = $event.detail.value"
  />
</template>
```
