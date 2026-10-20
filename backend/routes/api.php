<?php
use App\Http\Controllers\Api\PropertyController;
use Illuminate\Support\Facades\Route;
Route::get('/projects',[PropertyController::class,'projects']);
Route::post('/projects',[PropertyController::class,'storeProject']);
Route::get('/property-units',[PropertyController::class,'units']);
Route::post('/property-units',[PropertyController::class,'storeUnit']);
