<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';

    protected $fillable = [
        'code',
        'name',
        'emails',
        'contacts',
        'addresses',
        'website',
        'notes',
        'invoicing_contact',
        'warnings',
    ];

    protected $casts = [
        'emails' => 'array',
        'contacts' => 'array',
        'addresses' => 'array',
        'warnings' => 'array',
    ];
}
