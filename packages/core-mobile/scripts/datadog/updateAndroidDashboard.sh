curl -X PUT \
  https://api.datadoghq.com/api/v1/dashboard/uwh-t2q-ne7 \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -H "Cache-Control: no-cache"  \
  -d @- << EOF
  {
    "title": "Android Mobile Performance Dashboard",
    "description": "Performance metrics for Core Android",
    "widgets":
    [
        {
            "id": 7237385668453448,
            "definition":
            {
                "title": "Overall Performance",
                "background_color": "gray",
                "show_title": true,
                "type": "group",
                "layout_type": "ordered",
                "widgets":
                [
                    {
                        "id": 2878325580401984,
                        "definition":
                        {
                            "title": " App Startup Time",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "query_value",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "number_format":
                                            {
                                                "unit":
                                                {
                                                    "type": "canonical_unit",
                                                    "unit_name": "nanosecond"
                                                }
                                            },
                                            "formula": "query2"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query2",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:action @action.type:application_start @session.type:user service:com.avaxwallet @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@action.loading_time"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "conditional_formats":
                                    [
                                        {
                                            "palette": "black_on_light_red",
                                            "value": 5000000000,
                                            "comparator": ">"
                                        },
                                        {
                                            "palette": "black_on_light_yellow",
                                            "value": 4500000000,
                                            "comparator": ">"
                                        },
                                        {
                                            "palette": "black_on_light_green",
                                            "value": 4000000000,
                                            "comparator": "<="
                                        }
                                    ],
                                    "response_format": "scalar"
                                }
                            ],
                            "autoscale": true,
                            "precision": 2,
                            "timeseries_background":
                            {
                                "yaxis":
                                {
                                    "include_zero": false
                                },
                                "type": "area"
                            }
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 0,
                            "width": 3,
                            "height": 2
                        }
                    },
                    {
                        "id": 6199483159313698,
                        "definition":
                        {
                            "title": "Refresh Rate",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "query_value",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "query2"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query2",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user service:com.avaxwallet @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@view.refresh_rate_average"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "conditional_formats":
                                    [
                                        {
                                            "palette": "black_on_light_red",
                                            "value": 39,
                                            "comparator": "<"
                                        },
                                        {
                                            "palette": "black_on_light_yellow",
                                            "value": 50,
                                            "comparator": "<"
                                        },
                                        {
                                            "palette": "black_on_light_green",
                                            "value": 50,
                                            "comparator": ">="
                                        }
                                    ],
                                    "response_format": "scalar"
                                }
                            ],
                            "autoscale": true,
                            "precision": 2,
                            "timeseries_background":
                            {
                                "yaxis":
                                {
                                    "include_zero": false
                                },
                                "type": "area"
                            }
                        },
                        "layout":
                        {
                            "x": 3,
                            "y": 0,
                            "width": 3,
                            "height": 2
                        }
                    },
                    {
                        "id": 8096566132414896,
                        "definition":
                        {
                            "title": "Crash free Sessions",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "query_value",
                            "requests":
                            [
                                {
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "query2",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:session @session.crash.count:>0 @session.type:user @os.name:Android service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@session.id"
                                            },
                                            "storage": "hot"
                                        },
                                        {
                                            "data_source": "rum",
                                            "name": "query1",
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@session.id"
                                            },
                                            "group_by":
                                            [],
                                            "search":
                                            {
                                                "query": "@application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @type:session"
                                            }
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "number_format":
                                            {
                                                "unit":
                                                {
                                                    "label": "%",
                                                    "type": "custom_unit_label"
                                                }
                                            },
                                            "formula": "(1 - query2 / query1) * 100"
                                        }
                                    ],
                                    "conditional_formats":
                                    [
                                        {
                                            "comparator": "<",
                                            "palette": "black_on_light_red",
                                            "value": 98
                                        },
                                        {
                                            "comparator": "<",
                                            "palette": "black_on_light_yellow",
                                            "value": 99.8
                                        },
                                        {
                                            "comparator": "<=",
                                            "palette": "black_on_light_green",
                                            "value": 100
                                        }
                                    ]
                                }
                            ],
                            "autoscale": true,
                            "precision": 2,
                            "timeseries_background":
                            {
                                "yaxis":
                                {
                                    "include_zero": false
                                },
                                "type": "area"
                            }
                        },
                        "layout":
                        {
                            "x": 6,
                            "y": 0,
                            "width": 3,
                            "height": 2
                        }
                    },
                    {
                        "id": 6590797298281856,
                        "definition":
                        {
                            "title": "Memory Average",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "query_value",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "query2"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query2",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @os.name:Android service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@view.memory_average"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "conditional_formats":
                                    [
                                        {
                                            "palette": "black_on_light_red",
                                            "value": 39,
                                            "comparator": "<"
                                        },
                                        {
                                            "palette": "black_on_light_yellow",
                                            "value": 50,
                                            "comparator": "<"
                                        },
                                        {
                                            "palette": "black_on_light_green",
                                            "value": 50,
                                            "comparator": ">="
                                        }
                                    ],
                                    "response_format": "scalar"
                                }
                            ],
                            "autoscale": true,
                            "precision": 2,
                            "timeseries_background":
                            {
                                "yaxis":
                                {
                                    "include_zero": false
                                },
                                "type": "area"
                            }
                        },
                        "layout":
                        {
                            "x": 9,
                            "y": 0,
                            "width": 3,
                            "height": 2
                        }
                    }
                ]
            },
            "layout":
            {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 3
            }
        },
        {
            "id": 1416264083016910,
            "definition":
            {
                "title": "Views Performance",
                "background_color": "vivid_green",
                "show_title": true,
                "type": "group",
                "layout_type": "ordered",
                "widgets":
                [
                    {
                        "id": 8608921316943666,
                        "definition":
                        {
                            "title": "Android Views with the most frozen frames",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "toplist",
                            "requests":
                            [
                                {
                                    "conditional_formats":
                                    [
                                        {
                                            "comparator": ">",
                                            "palette": "white_on_red",
                                            "value": 0
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @view.frozen_frame.count:>0 service:com.avaxwallet @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "cardinality",
                                                        "order": "desc",
                                                        "metric": "@view.id"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@view.id"
                                            },
                                            "storage": "hot"
                                        },
                                        {
                                            "data_source": "rum",
                                            "name": "query2",
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@view.id"
                                            },
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "order": "desc",
                                                        "aggregation": "cardinality",
                                                        "metric": "@view.id"
                                                    }
                                                }
                                            ],
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @application.name:\"Core Mobile\" @os.name:Android"
                                            }
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "alias": "% of Views with Frozen Frames",
                                            "formula": "100 * (query1 / query2)"
                                        }
                                    ],
                                    "sort":
                                    {
                                        "count": 10,
                                        "order_by":
                                        [
                                            {
                                                "type": "formula",
                                                "index": 0,
                                                "order": "desc"
                                            }
                                        ]
                                    }
                                }
                            ],
                            "style":
                            {}
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 0,
                            "width": 9,
                            "height": 2
                        }
                    },
                    {
                        "id": 6294409523896582,
                        "definition":
                        {
                            "type": "note",
                            "content": "### Frozen frames ###\n\nFrames that take longer than  to render appear as stuck and unresponsive in your application. These are classified as frozen frames.\n",
                            "background_color": "yellow",
                            "font_size": "14",
                            "text_align": "left",
                            "vertical_align": "center",
                            "show_tick": true,
                            "tick_pos": "50%",
                            "tick_edge": "left",
                            "has_padding": true
                        },
                        "layout":
                        {
                            "x": 9,
                            "y": 0,
                            "width": 3,
                            "height": 2
                        }
                    },
                    {
                        "id": 527550427816688,
                        "definition":
                        {
                            "title": "Android views with the highest percentage of slow renders",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "toplist",
                            "requests":
                            [
                                {
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @view.is_slow_rendered:true @os.name:Android service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "cardinality",
                                                        "order": "desc",
                                                        "metric": "@view.id"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@view.id"
                                            },
                                            "storage": "hot"
                                        },
                                        {
                                            "data_source": "rum",
                                            "name": "query2",
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@view.id"
                                            },
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "order": "desc",
                                                        "aggregation": "cardinality",
                                                        "metric": "@view.id"
                                                    }
                                                }
                                            ],
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @application.name:\"Core Mobile\" @os.name:Android"
                                            }
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "alias": "% of Views with Slow Renders",
                                            "formula": "100 * (query1 / query2)"
                                        }
                                    ],
                                    "sort":
                                    {
                                        "count": 10,
                                        "order_by":
                                        [
                                            {
                                                "type": "formula",
                                                "index": 0,
                                                "order": "desc"
                                            }
                                        ]
                                    }
                                }
                            ],
                            "style":
                            {}
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 2,
                            "width": 9,
                            "height": 2
                        }
                    },
                    {
                        "id": 5942947520026884,
                        "definition":
                        {
                            "type": "note",
                            "content": "### Slow renders ###\n\nWith slow renders data, you can monitor which views are taking longer than  or  to render.\n\n**Note:** Refresh rates are normalized on a range of zero to 60fps. ",
                            "background_color": "yellow",
                            "font_size": "14",
                            "text_align": "left",
                            "vertical_align": "center",
                            "show_tick": true,
                            "tick_pos": "50%",
                            "tick_edge": "left",
                            "has_padding": true
                        },
                        "layout":
                        {
                            "x": 9,
                            "y": 2,
                            "width": 3,
                            "height": 2
                        }
                    },
                    {
                        "id": 7403012191699538,
                        "definition":
                        {
                            "title": "Android Long Task Duration by View Name (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "a",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:long_task @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @os.name:Android version:$BUILD_NUMBER"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "avg",
                                                        "order": "desc",
                                                        "metric": "@long_task.duration"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@long_task.duration"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "formula": "a"
                                        }
                                    ],
                                    "sort":
                                    {
                                        "count": 10,
                                        "order_by":
                                        [
                                            {
                                                "type": "formula",
                                                "index": 0,
                                                "order": "desc"
                                            }
                                        ]
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 4,
                            "width": 12,
                            "height": 4
                        }
                    }
                ]
            },
            "layout":
            {
                "x": 0,
                "y": 3,
                "width": 12,
                "height": 9
            }
        },
        {
            "id": 5414966588799072,
            "definition":
            {
                "title": "Errors",
                "background_color": "orange",
                "show_title": true,
                "type": "group",
                "layout_type": "ordered",
                "widgets":
                [
                    {
                        "id": 6860145306777690,
                        "definition":
                        {
                            "title": "Top Screens with Crashes",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "toplist",
                            "requests":
                            [
                                {
                                    "conditional_formats":
                                    [
                                        {
                                            "palette": "white_on_red",
                                            "value": 0,
                                            "comparator": ">"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 250,
                                                    "sort":
                                                    {
                                                        "aggregation": "count",
                                                        "order": "desc",
                                                        "metric": "count"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "count",
                                                "metric": "count",
                                                "interval": 3600000
                                            },
                                            "storage": "hot"
                                        },
                                        {
                                            "search":
                                            {
                                                "query": "@view.crash.count:>0 @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @type:view"
                                            },
                                            "data_source": "rum",
                                            "compute":
                                            {
                                                "interval": 3600000,
                                                "aggregation": "count"
                                            },
                                            "name": "query2",
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "sort":
                                                    {
                                                        "aggregation": "count",
                                                        "order": "desc"
                                                    },
                                                    "limit": 250
                                                }
                                            ]
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "alias": "% of Views with Errors",
                                            "formula": "(1 - (query1 - query2) / query1) * 100"
                                        }
                                    ],
                                    "sort":
                                    {
                                        "count": 10,
                                        "order_by":
                                        [
                                            {
                                                "type": "formula",
                                                "index": 0,
                                                "order": "desc"
                                            }
                                        ]
                                    }
                                }
                            ],
                            "style":
                            {}
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 3
                        }
                    },
                    {
                        "id": 2955469739865264,
                        "definition":
                        {
                            "title": "Top Screens with Errors",
                            "title_size": "16",
                            "title_align": "left",
                            "type": "toplist",
                            "requests":
                            [
                                {
                                    "conditional_formats":
                                    [
                                        {
                                            "palette": "white_on_red",
                                            "value": 0,
                                            "comparator": ">"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 250,
                                                    "sort":
                                                    {
                                                        "aggregation": "count",
                                                        "order": "desc",
                                                        "metric": "count"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "count",
                                                "metric": "count",
                                                "interval": 3600000
                                            },
                                            "storage": "hot"
                                        },
                                        {
                                            "search":
                                            {
                                                "query": "@view.error.count:>0 @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @type:view"
                                            },
                                            "data_source": "rum",
                                            "compute":
                                            {
                                                "interval": 3600000,
                                                "aggregation": "count"
                                            },
                                            "name": "query2",
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "sort":
                                                    {
                                                        "aggregation": "count",
                                                        "order": "desc"
                                                    },
                                                    "limit": 250
                                                }
                                            ]
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "alias": "% of Views with Errors",
                                            "formula": "(1 - (query1 - query2) / query1) * 100"
                                        }
                                    ],
                                    "sort":
                                    {
                                        "count": 10,
                                        "order_by":
                                        [
                                            {
                                                "type": "formula",
                                                "index": 0,
                                                "order": "desc"
                                            }
                                        ]
                                    }
                                }
                            ],
                            "style":
                            {}
                        },
                        "layout":
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 3
                        }
                    }
                ]
            },
            "layout":
            {
                "x": 0,
                "y": 12,
                "width": 12,
                "height": 4
            }
        },
        {
            "id": 8788703574782134,
            "definition":
            {
                "title": "Latest Release Performance",
                "background_color": "purple",
                "show_title": true,
                "type": "group",
                "layout_type": "ordered",
                "widgets":
                [
                    {
                        "id": 7860422761109870,
                        "definition":
                        {
                            "title": "Android Application Start Time (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "query1"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:action @session.type:user @action.type:application_start -version:<$BUILD_NUMBER @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "pc90",
                                                        "order": "desc",
                                                        "metric": "@action.loading_time"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "pc90",
                                                "metric": "@action.loading_time"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "style":
                                    {
                                        "palette": "semantic"
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 0,
                            "width": 12,
                            "height": 3
                        }
                    },
                    {
                        "id": 3399978578368796,
                        "definition":
                        {
                            "time":
                            {},
                            "title": "Android Percentage of Frozen Frames for Version: $BUILD_NUMBER",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "100 * (query1 / query2)"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @view.frozen_frame.count:>0 @os.name:Android version:$BUILD_NUMBER"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "cardinality",
                                                        "order": "desc",
                                                        "metric": "@view.id"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@view.id"
                                            },
                                            "storage": "hot"
                                        },
                                        {
                                            "name": "query2",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @session.type:user @application.name:\"Core Mobile\" @os.name:Android version:$BUILD_NUMBER"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "cardinality",
                                                        "order": "desc",
                                                        "metric": "@view.id"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "cardinality",
                                                "metric": "@view.id"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "style":
                                    {
                                        "palette": "datadog16"
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 3,
                            "width": 12,
                            "height": 3
                        }
                    },
                    {
                        "id": 4656190487528324,
                        "definition":
                        {
                            "title": "Android Errors (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "query1"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:error @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @os.name:Android -version:<$BUILD_NUMBER service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "count",
                                                        "order": "desc",
                                                        "metric": "count"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "count",
                                                "metric": "count"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "style":
                                    {
                                        "palette": "datadog16"
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 6,
                            "width": 6,
                            "height": 4
                        }
                    },
                    {
                        "id": 4935670314411118,
                        "definition":
                        {
                            "time":
                            {
                                "hide_incomplete_cost_data": true
                            },
                            "title": "Android Memory Consumption (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "a"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "a",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @os.name:Android -version:<$BUILD_NUMBER service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "avg",
                                                        "order": "desc",
                                                        "metric": "@view.memory_average"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@view.memory_average"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "style":
                                    {
                                        "palette": "datadog16"
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 6,
                            "y": 6,
                            "width": 6,
                            "height": 4
                        }
                    },
                    {
                        "id": 4466470907554154,
                        "definition":
                        {
                            "title": "Android average Click or Tap load time (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "a",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:action @device.type:Mobile @action.type:(click OR tap) -version:<$BUILD_NUMBER @os.name:Android service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "avg",
                                                        "order": "desc",
                                                        "metric": "@action.loading_time"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@action.loading_time"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "formula": "a"
                                        }
                                    ]
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 10,
                            "width": 6,
                            "height": 4
                        }
                    },
                    {
                        "id": 3077574839378720,
                        "definition":
                        {
                            "time":
                            {
                                "hide_incomplete_cost_data": true
                            },
                            "title": "Android Build Action Loading Time (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "response_format": "scalar",
                                    "queries":
                                    [
                                        {
                                            "name": "a",
                                            "data_source": "rum",
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@action.loading_time"
                                            },
                                            "search":
                                            {
                                                "query": "@type:action @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user @action.type:tap @os.name:Android service:com.avaxwallet -version:<$BUILD_NUMBER"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@action.name",
                                                    "limit": 10,
                                                    "should_exclude_missing": true,
                                                    "sort":
                                                    {
                                                        "aggregation": "avg",
                                                        "order": "desc",
                                                        "metric": "@action.loading_time"
                                                    }
                                                }
                                            ],
                                            "storage": "hot"
                                        }
                                    ],
                                    "formulas":
                                    [
                                        {
                                            "formula": "a"
                                        }
                                    ],
                                    "sort":
                                    {
                                        "count": 10,
                                        "order_by":
                                        [
                                            {
                                                "type": "formula",
                                                "index": 0,
                                                "order": "desc"
                                            }
                                        ]
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 6,
                            "y": 10,
                            "width": 6,
                            "height": 4
                        }
                    },
                    {
                        "id": 2091766263734094,
                        "definition":
                        {
                            "time":
                            {
                                "hide_incomplete_cost_data": true
                            },
                            "title": "Android Refresh Rate by version(Update with script and set alert if refresh rate drops below threshold)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "a"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "a",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @os.name:Android"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "version",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "median",
                                                        "order": "desc",
                                                        "metric": "@view.refresh_rate_average"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "median",
                                                "metric": "@view.refresh_rate_average"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "style":
                                    {
                                        "palette": "datadog16"
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 0,
                            "y": 14,
                            "width": 6,
                            "height": 4
                        }
                    },
                    {
                        "id": 2961425376476106,
                        "definition":
                        {
                            "title": "Android Memory Consumption by View Name (Version: $BUILD_NUMBER)",
                            "type": "treemap",
                            "requests":
                            [
                                {
                                    "formulas":
                                    [
                                        {
                                            "formula": "query1"
                                        }
                                    ],
                                    "queries":
                                    [
                                        {
                                            "name": "query1",
                                            "data_source": "rum",
                                            "search":
                                            {
                                                "query": "@type:view @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @os.name:Android version:>$BUILD_NUMBER service:com.avaxwallet"
                                            },
                                            "indexes":
                                            [
                                                "*"
                                            ],
                                            "group_by":
                                            [
                                                {
                                                    "facet": "@view.name",
                                                    "limit": 10,
                                                    "sort":
                                                    {
                                                        "aggregation": "avg",
                                                        "order": "desc",
                                                        "metric": "@view.memory_average"
                                                    },
                                                    "should_exclude_missing": true
                                                }
                                            ],
                                            "compute":
                                            {
                                                "aggregation": "avg",
                                                "metric": "@view.memory_average"
                                            },
                                            "storage": "hot"
                                        }
                                    ],
                                    "response_format": "scalar",
                                    "style":
                                    {
                                        "palette": "datadog16"
                                    }
                                }
                            ]
                        },
                        "layout":
                        {
                            "x": 6,
                            "y": 14,
                            "width": 6,
                            "height": 4
                        }
                    }
                ]
            },
            "layout":
            {
                "x": 0,
                "y": 16,
                "width": 12,
                "height": 19,
                "is_column_break": true
            }
        }
    ],
    "template_variables":
    [
        {
            "name": "env",
            "prefix": "env",
            "available_values":
            [
                "development"
            ],
            "default": "development"
        },
        {
            "name": "device",
            "prefix": "@os.name",
            "available_values":
            [],
            "default": "*"
        },
        {
            "name": "version",
            "prefix": "@version",
            "available_values":
            [],
            "default": "*"
        }
    ],
    "layout_type": "ordered",
    "notify_list":
    [],
    "reflow_type": "fixed"
}
EOF

# Updates the monitor for memory use
echo "Updating monitor for memory use"
curl -X PUT "https://api.datadoghq.com/api/v1/monitor/157023465" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: $DD_API_KEY" \
-H "DD-APPLICATION-KEY: $DD_APP_KEY" \
-d @- << EOF
{
	"name": "[core mobile] Memory Use Exceeds the Recommended Threshold on Android",
	"type": "rum alert",
	"query": "rum(\"@type:view @os.name:Android -version:<$BUILD_NUMBER service:com.avaxwallet\").rollup(\"avg\", \"@view.memory_average\").by(\"version\").last(\"1d\") > 734000000",
	"message": "{{#is_alert}}Memory use is over 700mb.  Double check the changes made today and revert or update to decrease memory usage.{{/is_alert}}\n\n{{#is_warning}}Memory use is over 680mb which is approaching the acceptable threshold of 700 MB{{/is_warning}}\n\n@slack-shared-services-qa-mobile-dd-alerts",
	"tags": [],
	"options": {
		"thresholds": {
			"critical": 734000000,
			"warning": 713030000
		},
		"enable_logs_sample": false,
		"notify_audit": false,
		"on_missing_data": "default",
		"include_tags": true,
		"new_group_delay": 60,
		"groupby_simple_monitor": false
	},
	"priority": null,
	"restriction_policy": {
		"bindings": []
	}
}
EOF

# Updates the monitor for app start time
echo "Updating monitor for app start time"
curl -X PUT "https://api.datadoghq.com/api/v1/monitor/157091244" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: $DD_API_KEY" \
-H "DD-APPLICATION-KEY: $DD_APP_KEY" \
-d @- << EOF
{
    "name": "[core-mobile] App startup time on Android exceeds 7 seconds",
    "type": "rum alert",
    "query": "rum(\"@type:action @session.type:user @action.type:application_start @application.name:\"Core Mobile\" -version:<$BUILD_NUMBER service:com.avaxwallet\").rollup(\"avg\", \"@action.loading_time\").by(\"version\").last(\"1d\") > 4000000000",
    "message": "{{#is_alert}}Average app start time is {{rum.attributes.[action.loading_time]}} nanoseconds which is over the accepted threshold of 7 seconds.  Double check the changes made today and revert or update to decrease app start time{{/is_alert}}\n\n{{#is_warning}}Average app start time is {{rum.attributes.[action.loading_time]}} nanoseconds which is approaching the acceptable threshold of 7 seconds{{/is_warning}}\n\n{{#is_recovery}}Average app start time has recovered at {{rum.attributes.[action.loading_time]}} which is below the acceptable threshold of 7 seconds{{/is_recovery}}\n\n@slack-shared-services-qa-mobile-dd-alerts",
    "tags":
    [],
    "options":
    {
        "thresholds":
        {
            "critical": 4000000000,
            "warning": 3500000000
        },
        "enable_logs_sample": false,
        "notify_audit": false,
        "on_missing_data": "default",
        "include_tags": true,
        "new_group_delay": 60,
        "notification_preset_name": "hide_query",
        "groupby_simple_monitor": false
    },
    "priority": null,
    "restriction_policy":
    {
        "bindings":
        []
    }
}
EOF

# Updates the monitor for frozen frames
echo "Updating monitor for frozen frames"
curl -X PUT "https://api.datadoghq.com/api/v1/monitor/157112708" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: $DD_API_KEY" \
-H "DD-APPLICATION-KEY: $DD_APP_KEY" \
-d @- << EOF
{
	"name": "[core-mobile] Percentage of frozen frames is above threshold for Android",
	"type": "rum alert",
	"query": "formula(\"100 * (query1 / query2)\").last(\"5m\") > 15",
	"message": "{{#is_alert}}The percentage of frozen frames is above the set threshold of 15% for version {{version.name}}.  Please check your changes and optimize your code to dismiss this alert.{{/is_alert}}\n\n{{#is_alert_to_warning}}The percentage of frozen frames is above 13% for version {{version.name}}.  This is close to the acceptable threshold of 15%.{{/is_alert_to_warning}}\n\n{{#is_alert_recovery}}Percentage of frozen frames has recovered for {{version.name}}.  Nice work!{{/is_alert_recovery}}\n\n@slack-Avalanche-shared-services-qa-mobile-dd-alerts",
	"tags": [],
	"options": {
		"thresholds": {
			"critical": 15,
			"warning": 13,
			"critical_recovery": 13,
			"warning_recovery": 12.5
		},
		"enable_logs_sample": false,
		"notify_audit": false,
		"on_missing_data": "default",
		"variables": [
			{
				"data_source": "rum",
				"name": "query1",
				"indexes": [
					"*"
				],
				"compute": {
					"aggregation": "cardinality",
					"metric": "@view.id"
				},
				"group_by": [
					{
						"facet": "version",
						"limit": 10,
						"sort": {
							"order": "desc",
							"aggregation": "cardinality",
							"metric": "@view.id"
						}
					}
				],
				"search": {
					"query": "@type:view @session.type:user @view.frozen_frame.count:>0 @application.name:\"Core Mobile\" version:$BUILD_NUMBER @os.name:Android"
				},
				"storage": "hot"
			},
			{
				"data_source": "rum",
				"name": "query2",
				"indexes": [
					"*"
				],
				"compute": {
					"aggregation": "cardinality",
					"metric": "@view.id"
				},
				"group_by": [
					{
						"facet": "version",
						"limit": 10,
						"sort": {
							"order": "desc",
							"aggregation": "cardinality",
							"metric": "@view.id"
						}
					}
				],
				"search": {
					"query": "@type:view @session.type:user @application.name:\"Core Mobile\" @os.name:Android version:$BUILD_NUMBER"
				}
			}
		],
		"include_tags": true,
		"new_group_delay": 60,
		"notification_preset_name": "hide_query",
		"groupby_simple_monitor": false
	},
	"priority": null,
	"restriction_policy": {
		"bindings": []
	}
}
EOF

# Updates the monitor for crash free sessions
echo "Updating monitor for crash free sessions"
curl -X PUT "https://api.datadoghq.com/api/v1/monitor/157022810" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: $DD_API_KEY" \
-H "DD-APPLICATION-KEY: $DD_APP_KEY" \
-d @- << EOF
{
	"name": "[core-mobile] Crash Free Sessions has dropped below 100% for Android",
	"type": "rum alert",
	"query": "formula(\"(1 - query2 / query1) * 100\").last(\"5m\") < 99",
	"message": "{{#is_alert}}Crash free sessions has dropped below 99% for version $BUILD_NUMBER! Please check test results and error reports to traceback this crash{{/is_alert}}\n\n{{#is_recovery}}Crash free sessions has returned to 100% for version $BUILD_NUMBER. Nice work!{{/is_recovery}}\n\n@slack-Avalanche-shared-services-qa-mobile-dd-alerts",
	"tags": [],
	"options": {
		"thresholds": {
			"critical": 99
		},
		"enable_logs_sample": false,
		"notify_audit": false,
		"on_missing_data": "default",
		"variables": [
			{
				"data_source": "rum",
				"name": "query2",
				"indexes": [
					"*"
				],
				"compute": {
					"aggregation": "cardinality",
					"metric": "@session.id"
				},
				"group_by": [],
				"search": {
					"query": "@type:session @session.crash.count:>0 @session.type:user service:com.avaxwallet @os.name:Android -version:<$BUILD_NUMBER"
				},
				"storage": "hot"
			},
			{
				"data_source": "rum",
				"name": "query1",
				"indexes": [
					"*"
				],
				"compute": {
					"aggregation": "cardinality",
					"metric": "@session.id"
				},
				"group_by": [],
				"search": {
					"query": "@type:session @application.id:4deaf0a2-6489-4a26-b05c-deb1f3673bbb @session.type:user"
				}
			}
		],
		"include_tags": false,
		"renotify_interval": 60,
		"renotify_statuses": [
			"alert"
		],
		"escalation_message": "",
		"new_host_delay": 300,
		"groupby_simple_monitor": false
	},
	"priority": null,
	"restriction_policy": {
		"bindings": []
	}
}
EOF