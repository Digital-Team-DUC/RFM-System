<?php
namespace Database\Factories;
use App\Models\PropertyUnit;
use Illuminate\Database\Eloquent\Factories\Factory;
class PropertyUnitFactory extends Factory {
    protected $model = PropertyUnit::class;
    public function definition(): array { return ['unit_code'=>fake()->unique()->bothify('A-##'),'zone'=>fake()->randomElement(['North','South','Central']),'property_type'=>'land_plot','land_area'=>fake()->randomFloat(2,60,240),'listing_price'=>fake()->randomFloat(2,45000,180000),'currency'=>'USD','status'=>fake()->randomElement(['available','available','reserved'])]; }
}
