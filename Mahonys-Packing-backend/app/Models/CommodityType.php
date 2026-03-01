<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommodityType extends Model
{
    protected $table = 'commodity_types';

    protected $fillable = ['name', 'acos_code', 'test_required', 'shrink_percent'];

    public function commodities(): HasMany
    {
        return $this->hasMany(Commodity::class, 'commodity_type_id');
    }
}
