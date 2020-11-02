<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 7 2020
 *
 */

namespace MikoPBX\PBXCoreREST\Lib;

use Exception;
use MikoPBX\Common\Models\CustomFiles;
use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Core\System\Util;
use MikoPBX\Service\Main;
use Phalcon\Di;
use Phalcon\Di\Injectable;

class SysinfoManagementProcessor extends Injectable
{
    /**
     * Processes System requests
     *
     * @param array $request
     *
     * @return \MikoPBX\PBXCoreREST\Lib\PBXApiResult
     */
    public static function callBack(array $request): PBXApiResult
    {
        $action         = $request['action'];
        $res            = new PBXApiResult();
        $res->processor = __METHOD__;
        switch ($action) {
            case 'getInfo':
                $res = self::getInfo();
                break;
            case 'getExternalIpInfo':
                $res = self::getExternalIpInfo();
                break;
            default:
                $res             = new PBXApiResult();
                $res->processor  = __METHOD__;
                $res->messages[] = "Unknown action - {$action} in sysinfoCallBack";
        }

        $res->function = $action;

        return $res;
    }

    /**
     * Gets system information
     *
     * @return PBXApiResult
     */
    private static function getInfo(): PBXApiResult
    {
        $res            = new PBXApiResult();
        $res->processor = __METHOD__;
        $res->success   = true;

        $res->success = true;
        $di           = Di::getDefault();
        $dirsConfig   = $di->getShared('config');
        $filenameTmp  = $dirsConfig->path('www.downloadCacheDir') . '/' . __FUNCTION__ . '_' . time() . '.txt';

        $content = self::prepareSysyinfoContent();

        file_put_contents($filenameTmp, $content);
        Util::addRegularWWWRights($filenameTmp);
        $res->data['filename'] = $filenameTmp;
        $res->processor        = __METHOD__;

        return $res;
    }

    /**
     * Prepares system information collection
     *
     * @return string
     */
    public static function prepareSysyinfoContent(): string
    {
        $content = self::getPBXVersion();
        $content .= self::getDate();
        $content .= self::getUpTime();
        $content .= self::getCpu();
        $content .= self::getMemInfo();
        $content .= self::getStorageInfo();
        $content .= self::getIfconfigInfo();
        $content .= self::getArpInfo();
        $content .= self::getRouteInfo();
        $content .= self::getIptablesInfo();
        $content .= self::getPingInfo();
        $content .= self::getOpenSSLInfo();
        $content .= self::getAsteriskInfo();
        $content .= self::getChangedConfigFiles();
        $content .= self::getCorruptedFiles();
        $content .= PHP_EOL . PHP_EOL;

        return $content;
    }

    /**
     * Gets date time information
     *
     * @return string
     */
    public static function getDate(): string
    {
        $content    = '───────────────────────────────────────── Date ─────────────────────────────────────────';
        $content    .= PHP_EOL . PHP_EOL;
        $datePath = Util::which('date');
        $ut         = [];
        Util::mwExec($datePath, $ut);
        $content .= implode(PHP_EOL, $ut). PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns PBX version
     *
     * @return string
     */
    private static function getPBXVersion(): string
    {
        $version = PbxSettings::getValueByKey('PBXVersion');
        $content = '─────────────────────────────────────── PBXVersion ───────────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        $content .= $version . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Gets uptime information
     *
     * @return string
     */
    public static function getUpTime(): string
    {
        $content    = '───────────────────────────────────────── Uptime ─────────────────────────────────────────';
        $content    .= PHP_EOL . PHP_EOL;
        $uptimePath = Util::which('uptime');
        $ut         = [];
        Util::mwExec($uptimePath, $ut);
        $uptime  = implode(PHP_EOL, $ut);
        $content .= $uptime . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Gets CPU lod information
     *
     * @return string
     */
    public static function getCpu(): string
    {
        $content    = '───────────────────────────────────────── CPU load ───────────────────────────────────────';
        $content    .= PHP_EOL . PHP_EOL;
        $ut         = [];
        $grepPath   = Util::which('grep');
        $mpstatPath = Util::which('mpstat');
        Util::mwExec("{$mpstatPath} | {$grepPath} all", $ut);
        preg_match("/^.*\s+all\s+.*\s+.*\s+.*\s+.*\s+.*\s+.*\s+.*\s+.*\s+(.*)\s*.*/i", $ut[0], $matches);
        $rv = 100 - $matches[1];

        if (100 < $rv) {
            $rv = 100;
        }

        $content .= round($rv, 2) . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Gets system memory information
     *
     * @return string
     */
    public static function getMemInfo(): string
    {
        $content  = '───────────────────────────────────────── MemInfo ────────────────────────────────────────';
        $content  .= PHP_EOL . PHP_EOL;
        $out      = [];
        $catPath  = Util::which('cat');
        $grepPath = Util::which('grep');
        $awkPath  = Util::which('awk');
        $freePath = Util::which('free');
        Util::mwExec("{$catPath} /proc/meminfo | {$grepPath} -C 0 'Inactive:' | {$awkPath} '{print $2}'", $out);
        $inactive = round((1 * implode($out)) / 1024, 2);
        $content  .= "inactive = {$inactive}" . PHP_EOL;
        Util::mwExec("{$catPath} /proc/meminfo | {$grepPath} -C 0 'MemFree:' | {$awkPath} '{print $2}'", $out);
        $free    = round((1 * implode($out)) / 1024, 2);
        $content .= "free = {$free}" . PHP_EOL;
        Util::mwExec("{$catPath} /proc/meminfo | {$grepPath} -C 0 'MemTotal:' | {$awkPath} '{print $2}'", $out);
        $total   = round((1 * implode($out)) / 1024, 2);
        $content .= "total = {$total}" . PHP_EOL . PHP_EOL;

        $content .= '────────────────────────────────────────── Free ─────────────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        Util::mwExec($freePath, $out);
        $content .= implode(PHP_EOL, $out) . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns df -h information
     *
     * @return string
     */
    private static function getStorageInfo(): string
    {
        $content = '─────────────────────────────────────────── df ───────────────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        $dfPath  = Util::which('df');
        $out     = [];
        Util::mwExec("{$dfPath} -h", $out);
        $dfOut   = implode(PHP_EOL, $out);
        $content .= $dfOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns ifconfig information
     *
     * @return string
     */
    private static function getIfconfigInfo(): string
    {
        $content      = '─────────────────────────────────────── ifconfig ──────────────────────────────────────';
        $content      .= PHP_EOL . PHP_EOL;
        $ifconfigPath = Util::which('ifconfig');
        $out          = [];
        Util::mwExec($ifconfigPath, $out);
        $ifconfigOut = implode(PHP_EOL, $out);
        $content     .= $ifconfigOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns arp information
     *
     * @return string
     */
    private static function getArpInfo(): string
    {
        $content = '─────────────────────────────────────────── arp ──────────────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        $arpPath = Util::which('arp');
        $out     = [];
        Util::mwExec($arpPath, $out);
        $arpOut  = implode(PHP_EOL, $out);
        $content .= $arpOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns route information
     *
     * @return string
     */
    private static function getRouteInfo(): string
    {
        $content   = '────────────────────────────────────────── route ─────────────────────────────────────────';
        $content   .= PHP_EOL . PHP_EOL;
        $routePath = Util::which('route');
        $out       = [];
        Util::mwExec($routePath, $out);
        $routeOut = implode(PHP_EOL, $out);
        $content  .= $routeOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns iptables information
     *
     * @return string
     */
    private static function getIptablesInfo(): string
    {
        $content      = '────────────────────────────────────────── iptables ──────────────────────────────────────';
        $content      .= PHP_EOL . PHP_EOL;
        $iptablesPath = Util::which('iptables');
        $out          = [];
        Util::mwExec("{$iptablesPath} -S", $out);
        $iptablesOut = implode(PHP_EOL, $out);
        $content     .= $iptablesOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns ping result to 8.8.8.8 and ya.ru
     *
     * @return string
     */
    private static function getPingInfo(): string
    {
        $content  = '──────────────────────────────────────────── ping ────────────────────────────────────────';
        $content  .= PHP_EOL . PHP_EOL;
        $pingPath = Util::which('ping');
        $out      = [];
        Util::mwExec("{$pingPath} 8.8.8.8 -w 2", $out);
        $pingOut = implode(PHP_EOL, $out);
        Util::mwExec("{$pingPath} ya.ru -w 2", $out);
        $ping2Out = implode(PHP_EOL, $out);
        $content  .= $pingOut . PHP_EOL;
        $content  .= PHP_EOL . PHP_EOL;
        $content  .= $ping2Out . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns openssl check license information
     *
     * @return string
     */
    private static function getOpenSSLInfo(): string
    {
        $opensslPath = Util::which('openssl');

        $content = '─────────────────────────────────────── openssl ─────────────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        $out     = [];
        Util::mwExec("{$opensslPath} s_client -connect lic.miko.ru:443", $out);
        $opensslOut = implode(PHP_EOL, $out);
        $content    .= $opensslOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns asterisk information
     *
     * @return string
     */
    private static function getAsteriskInfo(): string
    {
        $asteriskPath = Util::which('asterisk');

        $content = '────────────────────────────────── asterisk registrations ────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        Util::mwExec("{$asteriskPath} -rx 'pjsip show registrations' ", $out);
        $asteriskOut = implode(PHP_EOL, $out);
        $content     .= $asteriskOut . PHP_EOL;

        $content .= '────────────────────────────────── asterisk endpoints ───────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        Util::mwExec("{$asteriskPath} -rx 'pjsip show endpoints' ", $out);
        $asteriskOut = implode(PHP_EOL, $out);
        $content     .= $asteriskOut . PHP_EOL;

        $content .= '─────────────────────────────────── asterisk contacts ───────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        Util::mwExec("{$asteriskPath} -rx 'pjsip show contacts' ", $out);
        $asteriskOut = implode(PHP_EOL, $out);
        $content     .= $asteriskOut . PHP_EOL;
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns changed config files
     *
     * @return string
     */
    private static function getChangedConfigFiles(): string
    {
        $content = '────────────────────────────────── Changed config files ─────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        $files   = CustomFiles::find('mode!="none"');
        foreach ($files as $file) {
            $content .= "({$file->mode}){$file->filepath}" . PHP_EOL;
        }
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns changed core files
     *
     * @return string
     */
    private static function getCorruptedFiles(): string
    {
        $content = '──────────────────────────────────── Corrupted files ────────────────────────────────────';
        $content .= PHP_EOL . PHP_EOL;
        $files   = Main::checkForCorruptedFiles();
        foreach ($files as $file) {
            $content .= $file . PHP_EOL;
        }
        $content .= PHP_EOL . PHP_EOL;
        return $content;
    }

    /**
     * Returns public IP address of this system
     *
     * @return PBXApiResult
     */
    public static function getExternalIpInfo(): PBXApiResult
    {
        $res            = new PBXApiResult();
        $res->processor = __METHOD__;

        $curl = curl_init();
        if ($curl === false) {
            $res->messages[] = 'CURL initialization error';

            return $res;
        }
        $url = 'https://ipinfo.io/json';
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 2);

        try {
            $resultrequest = curl_exec($curl);
        } catch (Exception $e) {
            $res->messages[] = $e->getMessage();

            return $res;
        }
        curl_close($curl);
        if (Util::isJson($resultrequest)) {
            $res->success    = true;
            $response        = json_decode($resultrequest, true);
            $res->data['ip'] = $response['ip'];
        } else {
            $res->messages[] = 'Error format data ' . $resultrequest;
        }

        return $res;
    }

}