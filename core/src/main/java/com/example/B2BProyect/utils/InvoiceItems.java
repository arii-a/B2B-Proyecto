package com.example.B2BProyect.utils;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InvoiceItems {
    String description;
    String quantity;
    String formattedPrice;
}
