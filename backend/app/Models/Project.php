<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Project extends Model {
    use HasFactory;
    protected $fillable = ['code','name','name_km','type','location','total_land_area','start_date','expected_completion_date','status','reporting_currency','description'];
    protected function casts(): array { return ['total_land_area'=>'decimal:2','start_date'=>'date','expected_completion_date'=>'date']; }
    public function propertyUnits(): HasMany { return $this->hasMany(PropertyUnit::class); }
}
