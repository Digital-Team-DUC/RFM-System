<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PropertyUnit extends Model {
    use HasFactory;
    protected $fillable = ['project_id','unit_code','zone','property_type','land_area','building_area','listing_price','currency','status','facing_direction','bedrooms','bathrooms','notes'];
    protected function casts(): array { return ['land_area'=>'decimal:2','building_area'=>'decimal:2','listing_price'=>'decimal:2']; }
    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
}
