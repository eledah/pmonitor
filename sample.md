Based on the provided JSON structure, here is the schema for the relevant part and the location of the requested price and discount fields for the `default_variant`:

### Schema of Relevant Fields

The primary information is nested under `data.product.default_variant`.

```json
{
  "status": "integer",
  "data": {
    "product": {
      "id": "integer",
      "title_fa": "string",
      // ... other product fields
      "default_variant": {
        "id": "integer",
        // ... other variant fields
        "price": {
          "selling_price": "integer",
          "rrp_price": "integer",
          "order_limit": "integer",
          "is_incredible": "boolean",
          "is_promotion": "boolean",
          "is_locked_for_digiplus": "boolean",
          "bnpl_active": "boolean",
          "discount_percent": "integer",
          "timer": "integer",
          "badge": {
            "title": "string",
            "color": "string",
            "icon": "string"
          },
          "is_digiplus_promotion": "boolean",
          "is_digiplus_early_access": "boolean",
          "is_application_incredible": "boolean",
          "is_lightening_deal": "boolean",
          "is_plus_early_access": "boolean",
          "min_order_limit": "integer"
        }
      }
      // ... other product fields
    }
  }
}
```

### Location of Requested Fields (for `default_variant`)

All the requested fields are located inside the `price` object, which is a sub-object of `default_variant`.

| Field Name | Data Type (from example) | Full Path | Example Value |
| :--- | :--- | :--- | :--- |
| `selling_price` | Integer | `data.product.default_variant.price.selling_price` | `545000` |
| `rrp_price` | Integer | `data.product.default_variant.price.rrp_price` | `630000` |
| `is_incredible` | Boolean | `data.product.default_variant.price.is_incredible` | `true` |
| `discount_percent` | Integer | `data.product.default_variant.price.discount_percent` | `13` |