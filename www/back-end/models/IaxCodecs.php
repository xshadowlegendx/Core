<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 5 2018
 *
 */

namespace Models;
use Phalcon\Mvc\Model\Relation;

class IaxCodecs extends ModelsBase
{

    public $id;
    public $iaxuid;
    public $codec;
    public $priority;

    public function getSource()
    {
        return 'm_IaxCodecs';
    }

    public function initialize()
    {
	    parent::initialize();
        $this->belongsTo(
            'codec',
            'Models\Codecs',
            'name',
            [
	            "alias"=>"Codecs",
                "foreignKey" => [
                    "allowNulls" => false,
                    "action"     => Relation::NO_ACTION,
                ]
            ]
        );

        $this->belongsTo(
            'iaxuid',
            'Models\Iax',
            'uniqid',
            [
	            "alias"=>"Iax",
                "foreignKey" => [
                    "allowNulls" => false,
                    "action"     => Relation::NO_ACTION,
                ]
            ]
        );
    }
}